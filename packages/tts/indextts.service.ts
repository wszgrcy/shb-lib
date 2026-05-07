import {
  DownloadConfigToken,
  ExternalCallBaseService,
  HUGGINGFACE_TOKEN_TOKEN,
  HUGGINGFACE_URL_TOKEN,
} from '@cyia/external-call';
import { downloadFile, DownloadFileOptions } from '@cyia/dl';
import {
  IndexTTSConfigToken,
  IndexTTSOutputOpions,
} from './type/indextts.options.define';
import { computed, inject } from 'static-injector';
import { PythonAddonConfigToken } from './type';
import { path } from '@cyia/vfs2';
import fs from 'fs';
import { fetch, Agent } from 'undici';
import { AudioItemType, TTSFileConfigType } from './define';
import { ConfigManagerService } from './config-manager/manager.service';
import { deepClone, filterObjectEmptyKey } from '@cyia/util';
import { ResolvedGenerateOptions } from './type/resolved-audio-item.type';

const list = [
  'bigvgan_discriminator.pth',
  'bigvgan_generator.pth',
  'bpe.model',
  'dvae.pth',
  'gpt.pth',
  'unigram_12000.vocab',
  'config.yaml',
];
const INDEXTTS_REPO = 'IndexTeam/IndexTTS-1.5';

export class IndexTTSService extends ExternalCallBaseService {
  #paConfig$$ = inject(PythonAddonConfigToken);
  #modelUrl = inject(HUGGINGFACE_URL_TOKEN);
  #downloadConfig$$ = inject(DownloadConfigToken);
  #indexTTSModelDir$$ = computed(() =>
    path.join(this.#paConfig$$().dir, 'model', INDEXTTS_REPO),
  );
  #hgToken$$ = inject(HUGGINGFACE_TOKEN_TOKEN);
  override logName = 'TTS';

  /** 用于手动下载 */
  async downloadModel(options?: {
    progressMessage?: DownloadFileOptions['message'];
  }) {
    for (const relFilePath of list) {
      this.log?.info('⏳准备下载', relFilePath);
      const filePath = path.join(this.#indexTTSModelDir$$(), relFilePath);
      if (fs.existsSync(filePath)) {
        this.log?.info('✅已下载,跳过', filePath);
        continue;
      }
      await downloadFile(
        `https://${this.#modelUrl()}/${INDEXTTS_REPO}/resolve/main/${relFilePath}`,
        {
          ...this.#downloadConfig$$(),
          message: options?.progressMessage,
          savePath: filePath,
          headers: {
            token: this.#hgToken$$(),
            'software-bbs': `bbs.shenghuabi.site`,
          },
        },
      );
      this.log?.info('✅下载完成', filePath);
    }
  }
  async #modelDirExist() {
    const dir = this.#indexTTSModelDir$$();
    try {
      for (const relFilePath of list) {
        if (
          !fs.existsSync(path.join(this.#indexTTSModelDir$$(), relFilePath))
        ) {
          return false;
        }
      }
      return true;
    } catch (error) {
      this.log?.error(`检查模型文件夹[${dir}]异常`, error);
      return false;
    }
  }
  modelDownlading$$?: Promise<any>;
  /** 存在返回,不存在下载 */
  async #autoCheckDownloadModel() {
    const result = await this.#modelDirExist();
    if (result) {
      this.log?.info('✅存在模型');
      return;
    }
    if (!this.modelDownlading$$) {
      this.log?.info('⏳准备下载模型');
      this.modelDownlading$$ = this.downloadModel();
    }
    try {
      await this.modelDownlading$$;
    } catch (error) {
      this.log?.error('模型下载失败', error);
      throw error;
    } finally {
      this.modelDownlading$$ = undefined;
    }
    this.log?.info('模型下载完成');
  }

  #request(urlPath: string, body: any) {
    const URL = `http://${this.#paConfig$$().host}:${this.#paConfig$$().port}/${urlPath}`;
    this.log?.info();
    const Body = JSON.stringify(body);
    this.log?.info('准备请求', URL, Body);
    return fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: Body,
      dispatcher: new Agent({
        headersTimeout: 2e7,
        connectTimeout: 2e7,
        bodyTimeout: 2e7,
      }),
    }).then(async (response) => {
      if (!response.ok) {
        this.log?.error(response.statusText);
        const errorText = await response.text();
        this.log?.error(errorText);
        throw new Error(errorText ?? response.statusText);
      }
      return response;
    });
  }

  inited$$?: Promise<any>;
  #indexTTSConfig$$ = inject(IndexTTSConfigToken);

  async text2speech(
    options: ResolvedGenerateOptions & {
      commonOptions: IndexTTSOutputOpions;
    },
    output: string,
  ) {
    await this.#autoCheckDownloadModel();

    if (!this.inited$$) {
      const params = this.#indexTTSConfig$$().loadModelParams ?? {};
      delete (params as any)['use_deepspeed'];
      this.inited$$ = this.#request(`tts/IndexTTS/loadModel`, {
        model_dir: this.#indexTTSModelDir$$(),
        cfg_path: path.join(this.#indexTTSModelDir$$(), 'config.yaml'),
        ...params,
      });
    }
    await this.inited$$;
    await this.#request(`tts/IndexTTS/text2speech`, {
      audioPath: options.reference,
      text: options.audioText,
      options: options.commonOptions,
      output,
    });
  }
  override init(): void {}
  clear() {
    this.inited$$ = undefined;
  }
  #configManger = inject(ConfigManagerService);
  async configParser(item: AudioItemType, config?: TTSFileConfigType) {
    let defaultRef;
    item.generateOptions.audioText = (
      item.generateOptions.audioText ?? item.subtitle.text
    ).trim();
    if ('preset' in item.generateOptions.reference) {
      defaultRef = item.generateOptions.reference.preset;
    } else if ('language' in item.generateOptions.reference) {
      const fileLanguageId =
        config?.fileConfig.referenceMap?.[
          item.generateOptions.reference.language
        ];
      if (fileLanguageId) {
        defaultRef = fileLanguageId;
      } else {
        defaultRef = await this.#configManger.getDefaultLanguage(
          item.generateOptions.reference.language,
        );
      }
    }
    const GenerateOptions = deepClone({
      // 文件
      ...filterObjectEmptyKey(config?.fileConfig.generateOptions),
      // 自身
      ...filterObjectEmptyKey(item.generateOptions),
      reference: path.resolve(
        this.#paConfig$$().dir,
        (await this.#configManger.get(defaultRef!))!.filePath,
      ),
      commonOptions: this.#indexTTSConfig$$().options,
      audioText: item.generateOptions.audioText ?? item.subtitle.text,
    });
    return {
      ...item,
      generateOptions: GenerateOptions,
      audioOptions: {
        ...filterObjectEmptyKey(config?.fileConfig.audioOptions),
        ...filterObjectEmptyKey(item.audioOptions),
        speedControl: {
          ...filterObjectEmptyKey(
            config?.fileConfig.audioOptions?.speedControl,
          ),
          ...filterObjectEmptyKey(item.audioOptions?.speedControl),
        },
      },
    };
  }
}
