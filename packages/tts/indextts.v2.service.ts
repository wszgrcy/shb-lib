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
import { deepClone } from '@cyia/util';
import { AudioItemType, TTSFileConfigType } from './define';
import { ConfigManagerService } from './config-manager/manager.service';
import { IndexTTSService } from './indextts.service';
import { ResolvedGenerateOptions } from './type/resolved-audio-item.type';

const list = [
  'bpe.model',
  'config.yaml',
  'feat1.pt',
  'feat2.pt',
  'gpt.pth',
  's2mel.pth',
  'wav2vec2bert_stats.pt',
  'qwen0.6bemo4-merge/Modelfile',
  'qwen0.6bemo4-merge/added_tokens.json',
  'qwen0.6bemo4-merge/chat_template.jinja',
  'qwen0.6bemo4-merge/config.json',
  'qwen0.6bemo4-merge/generation_config.json',
  'qwen0.6bemo4-merge/merges.txt',
  'qwen0.6bemo4-merge/model.safetensors',
  'qwen0.6bemo4-merge/special_tokens_map.json',
  'qwen0.6bemo4-merge/tokenizer.json',
  'qwen0.6bemo4-merge/tokenizer_config.json',
  'qwen0.6bemo4-merge/vocab.json',
];
const OtherModelList = [
  { repo: 'amphion/MaskGCT', filePath: 'semantic_codec/model.safetensors' },
  { repo: 'facebook/w2v-bert-2.0', filePath: 'config.json' },
  { repo: 'facebook/w2v-bert-2.0', filePath: 'preprocessor_config.json' },
  { repo: 'facebook/w2v-bert-2.0', filePath: 'model.safetensors' },
  { repo: 'funasr/campplus', filePath: 'campplus_cn_common.bin' },
  { repo: 'nvidia/bigvgan_v2_22khz_80band_256x', filePath: 'config.json' },
  {
    repo: 'nvidia/bigvgan_v2_22khz_80band_256x',
    filePath: 'bigvgan_generator.pt',
  },
];
const INDEXTTS_REPO = 'IndexTeam/IndexTTS-2';
export class IndexTTSV2Service extends ExternalCallBaseService {
  #paConfig$$ = inject(PythonAddonConfigToken);
  #modelUrl = inject(HUGGINGFACE_URL_TOKEN);
  #downloadConfig$$ = inject(DownloadConfigToken);
  #modelDir$$ = computed(() => path.join(this.#paConfig$$().dir, 'model'));
  #indexTTSModelDir$$ = computed(() =>
    path.join(this.#paConfig$$().dir, 'model', INDEXTTS_REPO),
  );
  #hgToken$$ = inject(HUGGINGFACE_TOKEN_TOKEN);

  override logName = 'TTS';
  /** 用于手动下载 */
  async downloadModel(options?: {
    progressMessage?: DownloadFileOptions['message'];
  }) {
    for (const item of OtherModelList) {
      this.log?.info('⏳准备下载', item.repo, item.filePath);
      const filePath = path.join(this.#modelDir$$(), item.repo, item.filePath);
      if (fs.existsSync(filePath)) {
        this.log?.info('✅已下载,跳过', filePath);
        continue;
      }
      await downloadFile(
        `https://${this.#modelUrl()}/${item.repo}/resolve/main/${item.filePath}`,
        {
          ...this.#downloadConfig$$(),
          message: options?.progressMessage,
          savePath: filePath,
          headers: {
            token: this.#hgToken$$(),
            ['software-bbs']: `bbs.shenghuabi.site`,
          },
        },
      );
      this.log?.info('✅下载完成', filePath);
    }
    for (const relFilePath of list) {
      this.log?.info('⏳准备下载', relFilePath);
      const filePath = path.join(this.#indexTTSModelDir$$(), relFilePath);
      if (fs.existsSync(filePath)) {
        this.log?.info('已完成,跳过', filePath);
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
            ['software-bbs']: `bbs.shenghuabi.site`,
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
      this.log?.info('✅存在模型', this.#modelDir$$());
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
        headersTimeout: 9e7,
        connectTimeout: 9e7,
        bodyTimeout: 9e7,
        keepAliveTimeout: 9e7,
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
      verbose?: boolean;
      interval_silence?: number;
    },
    output: string,
  ) {
    await this.#autoCheckDownloadModel();

    if (!this.inited$$) {
      this.inited$$ = this.#request(`tts/IndexTTS/loadModel/v2`, {
        model_dir: this.#indexTTSModelDir$$(),
        cfg_path: path.join(this.#indexTTSModelDir$$(), 'config.yaml'),
        ...this.#indexTTSConfig$$().loadModelParams,
      });
    }
    await this.inited$$;
    const emo = deepClone(options.emo);
    if (emo) {
      if ('emo_vector' in emo) {
        emo.emo_vector = normalizeEmoVec(emo.emo_vector);
      }
      if ('emo_audio_prompt' in emo && 'emo_alpha' in emo) {
        emo.emo_alpha = emo.emo_alpha * 0.8;
      } else {
        (emo as any).emo_alpha = 1;
      }
    }

    await this.#request(`tts/IndexTTS/text2speech/v2`, {
      audioPath: options.reference,
      text: options.audioText,
      options: options.commonOptions,
      output,
      verbose: options.verbose,
      interval_silence: options.interval_silence,
      emo: emo,
    });
  }
  override init(): void {}
  clear() {
    this.inited$$ = undefined;
  }
  #configManger = inject(ConfigManagerService);
  #indextts = inject(IndexTTSService);
  async configParser(item: AudioItemType, config: TTSFileConfigType) {
    const result = await this.#indextts.configParser(item, config);
    const GenerateOptions = deepClone(result.generateOptions);
    if (GenerateOptions.emo) {
      if ('preset' in GenerateOptions.emo) {
        const preset = GenerateOptions.emo.preset;
        // 先找情绪
        GenerateOptions.emo = (await this.#configManger.getIndexTTSRef(preset))
          ?.config as any;
        if (!GenerateOptions.emo) {
          const itemResult = await this.#configManger.get(preset);
          if (itemResult) {
            //情绪没找到找默认的
            GenerateOptions.emo = {
              emo_audio_prompt: itemResult,
              emo_alpha: 1,
            };
          }
        } else if ('preset' in GenerateOptions.emo) {
          const itemResult = await this.#configManger.get(preset);
          if (itemResult) {
            //情绪没找到找默认的
            GenerateOptions.emo = {
              emo_audio_prompt: itemResult,
              emo_alpha: 1,
            };
          }
        }
      }
      if ('emo_audio_prompt' in GenerateOptions.emo) {
        GenerateOptions.emo.emo_audio_prompt = path.resolve(
          this.#paConfig$$().dir,
          (await this.#configManger.get(GenerateOptions.emo.emo_audio_prompt))!
            .filePath,
        ) as any;
      }
    }

    return {
      ...result,
      generateOptions: GenerateOptions,
    };
  }
}
type EmoVec = [number, number, number, number, number, number, number, number];
function normalizeEmoVec(emoVec: EmoVec): EmoVec {
  const kVec = [0.75, 0.7, 0.8, 0.8, 0.75, 0.75, 0.55, 0.45];

  const tmp = emoVec.map((value, index) => value * kVec[index]);

  const sumTmp = tmp.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0,
  );
  if (sumTmp > 0.8) {
    return tmp.map((value) => value * (0.8 / sumTmp)) as EmoVec;
  }

  return tmp as EmoVec;
}
