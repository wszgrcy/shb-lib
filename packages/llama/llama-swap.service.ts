import {
  DownloadConfigToken,
  ExternalCallBaseService,
  HUGGINGFACE_TOKEN_TOKEN,
  HUGGINGFACE_URL_TOKEN,
} from '@cyia/external-call';
import { computed, inject, Injector, signal } from 'static-injector';
import { path } from '@cyia/vfs2';
import { LLamaConfigToken } from './token';
import * as v from 'valibot';
import {
  DefaultCommonConfig,
  ExampleSpecificType,
  LlamaConfigDefine,
  LlamaConfigInputType,
  LlamaServerSwapItemDefine,
  LlamaServerSwapItemInputType,
  LlamaServerType,
} from './define';
import * as fs from 'fs';
import { parse, stringify } from 'yaml';
import {
  llamaFileNameByVersion,
  llamaSwapFileNameByVersion,
} from './util/file-name-by-version';
import { downloadFile, DownloadFileOptions } from '@cyia/dl';
import { getGgufFile } from './download/get-gguf-file';
import { getOllamaModel } from './ollama-model/ollama-manifests';
import { dirname } from 'path';
import { differenceBy } from 'es-toolkit';
const SysMap = { win32: 'win', linux: 'ubuntu' };
const LlamaPlatform = (SysMap as any)[process.platform];
const remoteArgs = ['hf-repo', 'hf-file', 'model-url'];
/**
 * 先写入配置,然后再初始化
 */
export class LlamaSwapService extends ExternalCallBaseService {
  override logName = 'llama.cpp';
  #config = inject(LLamaConfigToken);
  #llamaSwapPath$$ = computed(() =>
    path.join(this.#config().dir, 'llama-swap.config.yml'),
  );
  start$ = signal(false);
  llamaDir$$ = computed(() => {
    const fullPath = path.join(this.#config().dir, 'llama');
    if (this.#config().useRelConfigPath) {
      return path.relative(this.#config().cwd!, fullPath);
    }
    return fullPath;
  });
  llamaSwapDir$$ = computed(() => path.join(this.#config().dir, 'llama-swap'));
  #hgModelUrl$$ = inject(HUGGINGFACE_URL_TOKEN);
  #downloadConfig$$ = inject(DownloadConfigToken);
  #hgtoken$$ = inject(HUGGINGFACE_TOKEN_TOKEN);
  override startPath$$ = computed(() =>
    path.join(
      this.llamaSwapDir$$(),
      process.platform === 'win32' ? 'llama-swap.exe' : 'llama-swap',
    ),
  );
  override execPath$$ = this.startPath$$;
  override checkFilePath$$ = this.startPath$$;
  configExist$ = signal(false);
  checkConfigExist() {
    const result = fs.existsSync(this.#llamaSwapPath$$());
    if (!result) {
      this.log?.info(`初始化:等待配置文件[${this.#llamaSwapPath$$()}]创建`);
    }
    this.configExist$.set(result);
  }
  override async checkExist(): Promise<void> {
    await super.checkExist();
    this.checkConfigExist();
  }
  #injector = inject(Injector);
  #startFinished$?: Promise<ReturnType<typeof this.exec>>;

  override init(): void {
    if (this.start$()) {
      return;
    }
    this.startup();
  }
  async startup() {
    const exist = await this.exist();
    if (!exist) {
      return undefined;
    }
    if (!this.#startFinished$) {
      this.#startFinished$ = this.#startupLLamaSwap();
    }
    return this.#startFinished$;
  }
  #startupLLamaSwap() {
    return new Promise<any>((resolve, reject) => {
      this.log?.info('初始化:准备启动');
      const instance = this.exec(this.startPath$$(), [
        '-config',
        this.#llamaSwapPath$$(),
        '-listen',
        `${this.#config().listen}`,
        '-watch-config',
      ]);
      this.instanceSnapshot = [instance.instance];
      let isStart = false;
      instance.instance.stdout.on('data', (data) => {
        const content = data.toString() as string;
        if (!isStart && content.includes('listening on')) {
          this.start$.set(true);
          resolve(instance);
          isStart = true;
        }

        this.log?.info(content);
      });
      instance.instance.stderr.on('data', (data) => {
        const content = data.toString() as string;
        this.log?.info(content);
      });
    });
  }
  async convertOllamaModel(
    originList: any[],
    llamaVersion: string,
    OLLAMA_MODELS?: string,
  ) {
    const ollamaList = (await getOllamaModel(OLLAMA_MODELS)).map((item) => ({
      config: {
        common: {
          model: {
            enable: true,
            value: [item.value],
          },
          ...DefaultCommonConfig,
        },
      },
      exec: {
        version: llamaVersion,
        device: 'vulkan',
      },
      model: item.name,
    }));
    const result: { config: LlamaServerType }[] = differenceBy(
      originList,
      ollamaList,
      (item: any) => item.config?.common?.model?.value?.[0],
    );
    for (let index = 0; index < result.length; index++) {
      const item = result[index];
      if (
        item.config?.common?.model?.enable &&
        item.config.common.model.value?.[0]
      ) {
        if (!fs.existsSync(item.config.common.model.value![0])) {
          result.splice(index, 1);
          index--;
        }
      }
    }
    return [...result, ...ollamaList];
  }
  override stop() {
    try {
      super.stop();
    } catch (error) {
      this.log?.error(error);
    } finally {
      this.#startFinished$ = undefined;
      this.start$.set(false);
    }
  }
  #configToCmdOptions(config: LlamaServerType) {
    const list = [];
    // 去除远程参数,假如有本地的话
    let removeRemoteArgs = false;
    if (config.common?.model?.enable && config.common?.model?.value?.[0]) {
      removeRemoteArgs = true;
    }
    for (const item of [
      config.common,
      config.exampleSpecific,
      config.sampling,
    ]) {
      if (!item) {
        continue;
      }

      for (const [key, value] of Object.entries(item)) {
        if (removeRemoteArgs) {
          if (remoteArgs.includes(key)) {
            continue;
          }
        }
        if (value.enable) {
          list.push(`--${key}`);
          if ('value' in value && value.value) {
            list.push(...value.value);
          }
        }
      }
    }
    return list;
  }
  async writeConfig(config: LlamaConfigInputType) {
    this.log?.info(`准备写入llamaSwap配置`);
    const parsedConfig = v.parse(LlamaConfigDefine, config);
    const { list, global } = parsedConfig.server;
    const swapConfig = { models: {} as any, ...parsedConfig.swap };
    for (const serverItem of list) {
      const config = { ...global?.config, ...serverItem.config };
      if (global) {
        delete (global as any).config;
      }
      delete (serverItem as any).config;
      const commonConfig = { ...global, ...serverItem };
      if (commonConfig.env) {
        commonConfig.env = Object.entries(commonConfig.env).map(
          ([key, value]) => `${key}=${value}`,
        );
      }
      const cmdOptions = this.#configToCmdOptions(config);
      let exec;
      if (typeof commonConfig.exec === 'string') {
        exec = commonConfig.exec;
      } else {
        const exeDirName = llamaFileNameByVersion(
          commonConfig.exec!.version,
          commonConfig.exec!.device,
        );
        exec = path.join(
          this.llamaDir$$(),
          exeDirName,
          process.platform === 'win32'
            ? 'llama-server.exe'
            : 'build/bin/llama-server',
        );
        await this.checkOrDownloadLlama(
          exeDirName,
          commonConfig.exec!.version,
          commonConfig.exec!.device,
        );
      }
      if (process.platform === 'linux') {
        commonConfig.env = [
          ...((commonConfig.env as any) ?? []),
          `LD_LIBRARY_PATH=${dirname(exec)}`,
        ];
      }
      const cmd = `${exec} ${cmdOptions.join(' ')}`;
      const model = commonConfig.model;
      delete (commonConfig as any).model;
      delete (commonConfig as any).exec;

      swapConfig.models[model!] = {
        proxy: this.#getProxy(config.exampleSpecific),
        cmd,
        ...commonConfig,
      };
    }
    this.log?.info(`准备写入 ${this.#llamaSwapPath$$()}`);
    await fs.promises.writeFile(this.#llamaSwapPath$$(), stringify(swapConfig));
    this.log?.info(`写入完成`);
    await this.checkExist();
  }
  async downloadExec(
    version: string,
    options?: { progressMessage?: DownloadFileOptions['message'] },
  ) {
    this.stop();
    const result = await this.githubRepoDownload(
      {
        prefix: 'mostlygeek/llama-swap',
        version: version,
        fileName: llamaSwapFileNameByVersion(version),
      },
      {
        output: this.llamaSwapDir$$(),
        progressMessage: options?.progressMessage,
      },
    );
    await this.checkExist();
  }
  async downloadModel(
    modelOptions: {
      url?: string;
      repo?: string;
      token?: string;
      fileName?: string;
    },
    options?: { progressMessage?: DownloadFileOptions['message'] },
  ) {
    let url;
    let savePath;
    let directory;
    const dir = path.join(this.#config().dir, 'models');
    if (modelOptions.repo) {
      const resolveResult = await getGgufFile(modelOptions.repo, {
        ...modelOptions,
        endpoint: this.#hgModelUrl$$(),
        token: modelOptions.token || this.#hgtoken$$(),
      });
      this.log?.info('模型文件:', resolveResult);
      const filePath = path.join(dir, resolveResult.fileName);
      if (fs.existsSync(filePath)) {
        this.log?.info('模型已存在');
        return filePath;
      }
      url = resolveResult.fileList;
      savePath = filePath;
    } else if (modelOptions.url) {
      url = modelOptions.url;
      directory = dir;
    } else {
      throw new Error(`url/repo not found`);
    }
    return downloadFile(url, {
      message: options?.progressMessage,
      savePath: savePath,
      directory: directory,
      headers: {
        'software-bbs': 'bbs.shenghuabi.site',
      },
      ...this.#downloadConfig$$(),
    }).then((result) => {
      const filePath = result?.getFilePath();
      this.log?.info(`下载完成: ${filePath}`);
      return filePath;
    });
  }
  async checkOrDownloadLlama(
    dirName: string,
    version: string,
    device: string,
    options?: { progressMessage?: DownloadFileOptions['message'] },
  ) {
    this.log?.info(`检查 ${dirName} 文件夹是否存在`);
    const dir = path.join(this.llamaDir$$(), dirName);
    if (fs.existsSync(dir)) {
      this.log?.info(`已存在,跳过下载`);
      return;
    }
    this.log?.info(`准备下载 ${dirName}`);
    await this.downloadLlama(dirName, version, device, options);
    this.log?.info(`下载完成`);
  }
  async downloadLlama(
    dirName: string,
    version: string,
    device: string,
    options?: { progressMessage?: DownloadFileOptions['message'] },
  ) {
    await this.githubRepoDownload(
      {
        prefix: 'ggml-org/llama.cpp',
        version: version,
        fileName: llamaFileNameByVersion(version, device) + '.zip',
      },
      {
        output: path.join(this.llamaDir$$(), dirName),
        progressMessage: options?.progressMessage,
      },
    );
  }
  async createModelConfig(
    model: string,
    options?: { progressMessage?: DownloadFileOptions['message'] },
  ) {
    const downloadFilePath = await this.downloadModel(
      {
        repo: model,
      },
      options,
    );
    const result = v.parse(LlamaServerSwapItemDefine, {
      config: {
        common: {
          ...DefaultCommonConfig,
          model: {
            enable: true,
            value: [downloadFilePath!],
          },
        },
      },
      // 缺少可执行部分,需要返回后设置
      model: model,
    } as LlamaServerSwapItemInputType);
    return result;
  }
  override async getVersion(): Promise<string | undefined> {
    await this.checkExist();
    if (!this.exist$() || !this.start$()) {
      return undefined;
    }

    const { instance } = this.exec(this.execPath$$(), ['--version']);
    const regexp = /version:\s+(\d+)/;
    const matchResult = regexp.exec((await instance).stdout);
    if (matchResult) {
      return matchResult[1];
    }
    return undefined;
  }
  #getProxy(config?: ExampleSpecificType) {
    let hostStr;
    if (config?.host?.enable && config?.host.value?.[0]) {
      hostStr = config?.host.value[0];
    } else {
      hostStr = '127.0.0.1';
    }
    let portStr;
    if (config?.port?.enable && config?.port.value?.[0]) {
      portStr = config?.port.value[0];
    } else {
      portStr = '8080';
    }
    return `http://${hostStr}:${portStr}`;
  }
  async getLlamaSwapConfig() {
    const isExists = fs.existsSync(this.#llamaSwapPath$$());
    if (!isExists) {
      return undefined;
    }
    return parse(
      await fs.promises.readFile(this.#llamaSwapPath$$(), {
        encoding: 'utf-8',
      }),
    );
  }
  override destroy() {
    this.stop();
  }
}
