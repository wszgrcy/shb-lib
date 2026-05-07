import { closest } from 'fastest-levenshtein';
import {
  computed,
  inject,
  Injector,
  RootStaticInjectOptions,
  signal,
} from 'static-injector';
import { detectLanguage, SplitService } from './split/split.service';
import { ConfigManagerService } from './config-manager/manager.service';
import { PythonAddonConfigToken } from './type';
import { path } from '@cyia/vfs2';
import { promise as fastq } from 'fastq';
import { IndexTTSService } from './indextts.service';
import { ContactType, copyConcat } from '@shenghuabi/crunker';
import fs from 'fs';
import { createIdleClean, ExternalCallBaseService } from '@cyia/external-call';
import { ResultPromise } from 'execa';
import { MessageType } from '@cyia/dl';
import { BehaviorSubject } from 'rxjs';
// import { parseSync } from '@cyia/subtitle';
import { htmlToText } from 'html-to-text';
import * as v from 'valibot';
import { IndexTTSV2Service } from './indextts.v2.service';
import { generateChunkId } from './util/chunk-id';
import {
  AudioItemType,
  TTSFileConfigDefine,
  TTSFileConfigType,
} from './define';
import { TTSConfigToken } from './type/tts.define';
import { ResolvedAudioItemType } from './type/resolved-audio-item.type';
import { BackendType, TTSBackendImp } from './type/tts-backend.type';
import { deepClone } from '@cyia/util';
import { EmoListType, VoiceListType } from './config-manager/type';
import { cloneDeep, uniq } from 'es-toolkit';
import Parser from 'srt-parser-2';
const parser = new Parser();

function parseSync(srt: string) {
  return parser.fromSrt(srt);
}
export interface DetectPlayerContext {
  lineContext: string;
  context: string;
  content: string;
  playerList: string[];
  stateList: string[];
}
export async function defaultDetectReference(item: DetectPlayerContext) {
  return {
    player:
      item.playerList.find((player) => item.context.includes(player)) ||
      closest(item.context, item.playerList),
    state: 'default',
  };
}
export type AudioItem = AudioItemType & {
  origin: AudioItemType;
  metadata?: any;
};

export const TTSPluginDefine = v.object({
  changeAudioItemList: v.optional(
    v.array(
      v.object({
        name: v.string(),
        fn: v.custom<
          (
            info: AudioItemType,
            origin: AudioItemType,
            metadata?: any,
          ) => Promise<AudioItemType>
        >((item) => typeof item === 'function'),
        priority: v.optional(v.number(), 0),
      }),
    ),
  ),
  beforeConcatList: v.optional(
    v.array(
      v.object({
        name: v.string(),
        fn: v.custom<
          (
            input: ContactType[][],
            config: TTSFileConfigType,
          ) => Promise<ContactType[][]>
        >((item) => typeof item === 'function'),
        priority: v.optional(v.number(), 0),
      }),
    ),
  ),
  afterConcatList: v.optional(
    v.array(
      v.object({
        name: v.string(),
        fn: v.custom<
          (input: string, config: TTSFileConfigType) => Promise<string>
        >((item) => typeof item === 'function'),
        priority: v.optional(v.number(), 0),
      }),
    ),
  ),
});
export type TTSItem = NonNullable<
  v.InferOutput<typeof TTSPluginDefine>['changeAudioItemList']
>[number];
export type BeforeConcat = NonNullable<
  v.InferOutput<typeof TTSPluginDefine>['beforeConcatList']
>[number];
export type AfterConcat = NonNullable<
  v.InferOutput<typeof TTSPluginDefine>['afterConcatList']
>[number];

export class TTSPluginSerivce extends RootStaticInjectOptions {
  #map = new Map<string, TTSItem>();
  #beforeMap = new Map<string, BeforeConcat>();
  #afterMap = new Map<string, AfterConcat>();
  #ttsConfig = inject(TTSConfigToken);

  // 之前处理
  #beforePluginList$$ = computed(() =>
    (this.#ttsConfig().plugin?.activatedBeforeConcatList ?? [])
      .filter((item) => this.#beforeMap.has(item.name))
      .map((item) => this.#beforeMap.get(item.name)!)
      .sort((a, b) => a.priority - b.priority),
  );
  registerBeforeConcat(option: BeforeConcat) {
    this.#beforeMap.set(option.name, option);
    return () => this.#beforeMap.delete(option.name);
  }
  async beforeConcat(input: ContactType[][], config: any) {
    const list = this.#beforePluginList$$();
    input = deepClone(input);
    config = deepClone(config);
    for (const item of list) {
      input = await item.fn(input, config);
    }
    return input;
  }
  // 之后处理
  #afterPluginList$$ = computed(() =>
    (this.#ttsConfig().plugin?.activatedAfterConcatList ?? [])
      .filter((item) => this.#afterMap.has(item.name))
      .map((item) => this.#afterMap.get(item.name)!)
      .sort((a, b) => a.priority - b.priority),
  );
  registerAfterConcat(option: AfterConcat) {
    this.#afterMap.set(option.name, option);
    return () => this.#afterMap.delete(option.name);
  }
  async afterConcat(input: string, config: any) {
    const list = this.#afterPluginList$$();
    config = deepClone(config);
    for (const item of list) {
      input = await item.fn(input, config);
    }
    return input;
  }

  // 音频项处理
  registerAudioItem(option: TTSItem) {
    this.#map.set(option.name, option);
    return () => this.#map.delete(option.name);
  }
  getAudioItemPluginList() {
    return uniq([...this.#map.keys()]);
  }
  #pluginList$$ = computed(() =>
    (this.#ttsConfig().plugin?.activatedChangeAudioItemList ?? [])
      .filter((item) => this.#map.has(item.name))
      .map((item) => this.#map.get(item.name)!)
      .sort((a, b) => a.priority - b.priority),
  );

  /** 这里是强制用原始的进行处理 */
  async changeAudioItem(audioItem: AudioItem, pluginName?: string) {
    const pluginList = pluginName
      ? [this.#map.get(pluginName)!]
      : this.#pluginList$$();
    // eslint-disable-next-line prefer-const
    let { origin, metadata, ...other } = deepClone(audioItem);
    for (const item of pluginList) {
      other = await item.fn(other, cloneDeep(origin), cloneDeep(metadata));
    }
    return deepClone({
      ...other,
      metadata: metadata,
      origin: origin,
    }) as AudioItem;
  }
  reset(audioItem: AudioItem) {
    return deepClone({
      ...audioItem.origin,
      origin: audioItem.origin,
      metadata: audioItem.metadata,
    }) as AudioItem;
  }
  getChangeAudioItemList() {
    return [...this.#map.keys()];
  }
  getBeforeConcatList() {
    return [...this.#beforeMap.keys()];
  }
  getAfterConcatList() {
    return [...this.#afterMap.keys()];
  }
}
const BackendMap = {
  'IndexTTS-1.5': IndexTTSService,
  'IndexTTS-2': IndexTTSV2Service,
};
type RawAudioItem = { item: AudioItemType; metadata?: any };
const ChunkDirName = 'chunk';
const OutputDirName = 'output';
export class TTSSerivce extends ExternalCallBaseService {
  override logName = 'TTS';
  #injector = inject(Injector);
  #plugin = inject(TTSPluginSerivce);
  splitService = inject(SplitService);
  configManger = inject(ConfigManagerService);
  #pythonAddonConfig$$ = inject(PythonAddonConfigToken);
  chunk$$ = computed(() =>
    path.join(this.#pythonAddonConfig$$().dir, ChunkDirName),
  );
  output$$ = computed(() =>
    path.join(this.#pythonAddonConfig$$().dir, OutputDirName),
  );

  #modelDir$$ = computed(() =>
    path.join(this.#pythonAddonConfig$$().dir, 'model'),
  );
  start$ = new BehaviorSubject(0);

  async #getAudioList(fn: () => Promise<RawAudioItem[]>, options?: {}) {
    this.log?.info(`⏳准备拆分文本`);
    const audioQueue = new AudioQueue(this.#injector);
    return Promise.all(await fn())
      .then((list) =>
        Promise.all(
          list.map((item) =>
            this.#plugin.changeAudioItem({
              ...item.item,
              origin: deepClone({
                ...item.item,
              }),
              metadata: item.metadata,
            }),
          ),
        ),
      )
      .then(async (list) => {
        audioQueue.setConfig(
          v.parse(TTSFileConfigDefine, {
            list,
            fileConfig: {},
          }),
        );
        return audioQueue;
      });
  }
  /** 文本拆分,每一段找对对应的对话引用 */
  async getTextScript(
    data: { filePath: string; content: string },
    detectActor = defaultDetectReference,
    options?: {
      force?: boolean;
    },
  ) {
    return this.#getAudioList(async () => {
      const resolvedList: Promise<RawAudioItem>[] = [];
      const list = this.splitService.run(data.content);
      const playerList = await this.configManger.getAllPlayer$$();
      const stateList = await this.configManger.getAllState$$();
      const fq = fastq(async (promise: Promise<RawAudioItem>) => {
        resolvedList.push(promise);
        return promise;
      }, 1);
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const item2 = {
          subtitle: {
            text: item.content,
          },
          generateOptions: {
            // audioText: item.content,
            // indextts2使用
            emo: { emo_alpha: 1 },
          },
          audioOptions: {
            isParagraph: item.isStart,
            startInterval: item.isStart ? 0 : undefined,
          },
        } as AudioItem;
        if (item.type === 'chat' && item.context) {
          fq.push(
            detectActor({
              playerList: playerList,
              stateList,
              context: item.context,
              content: item.content,
              lineContext: list
                .slice(i - 2, i + 3)
                .map((item) => item.content)
                .join('\n'),
            }).then(async (reference) => {
              const ref = await this.configManger.get({
                ...reference,
                language: item.language,
              });
              let preset;
              if (ref) {
                const { player, state, language } = ref;
                preset = { player, state, language };
              }
              return {
                metadata: item,
                item: {
                  ...item2,
                  generateOptions: {
                    ...item2.generateOptions,
                    reference: preset
                      ? { preset: preset }
                      : { language: item.language },
                  },
                } as AudioItemType,
              };
            }),
          );
        } else {
          fq.push(
            Promise.resolve(undefined).then(() => ({
              metadata: item2,
              item: {
                ...item2,
                generateOptions: {
                  ...item2.generateOptions,
                  reference: { language: item.language },
                },
              } as AudioItemType,
            })),
          );
        }
      }
      await fq.drained();
      return Promise.all(resolvedList);
    }, options);
  }

  async getSrtScript(
    data: { filePath: string; content: string },
    detectActor = defaultDetectReference,
    options?: {},
  ) {
    return this.#getAudioList(async () => {
      const resolvedList: Promise<RawAudioItem>[] = [];
      // 音频
      const fq = fastq(async (promise: Promise<RawAudioItem>) => {
        resolvedList.push(promise);
        return promise;
      }, 1);
      const srtList = parseSync(data.content);
      for (let i = 0; i < srtList.length; i++) {
        const item = srtList[i];

        const defaultLanguage = detectLanguage(item.text);
        fq.push(
          Promise.resolve().then(() => {
            const text = item.text;
            return {
              item: {
                subtitle: {
                  text: text,
                  start: item.startSeconds,
                  end: item.endSeconds,
                },
                generateOptions: {
                  audioText: htmlToText(text),
                  reference: { language: defaultLanguage },
                  // indextts2使用
                  emo: { emo_alpha: 1 },
                },
                audioOptions: {},
              } as AudioItemType,
              metadata: item,
            };
          }),
        );
      }
      await fq.drained();
      return Promise.all(resolvedList);
    }, options);
  }
  async getByCustom(
    fn: (options: {
      voiceList: VoiceListType;
      indextTTSEmoList?: EmoListType;
    }) => Promise<RawAudioItem[]>,
    options?: {},
  ) {
    const { references, indexTTSEmoReferences } =
      await this.configManger.getConfig();
    return this.#getAudioList(async () => {
      const result = await fn({
        voiceList: references,
        indextTTSEmoList: indexTTSEmoReferences,
      });
      return result;
    }, options);
  }
  async text2speech(
    config: TTSFileConfigType,
    outputName: string,
    options?: {
      progress: (a: {
        index: number;
        count: number;
        chunkPath?: string;
      }) => void;
    },
  ) {
    this.log?.info(`⏳准备进行文本生成`);
    const queue = new AudioQueue(this.#injector);
    queue.setConfig(config);
    const list = await queue.getParsedList();
    await this.#startup();
    const backendInstance = this.#getBackend(this.#ttsConfig$$().backend);

    this.#idleClean?.stop();
    await fs.promises.mkdir(this.chunk$$(), { recursive: true });
    await fs.promises.mkdir(this.output$$(), { recursive: true });
    let audioFilePathList: ContactType[][] = [];
    const chunkList: (string | undefined)[] = [];
    const fq = fastq(async (item: ResolvedAudioItemType) => {
      const ttsContent = item.generateOptions.audioText;
      if (!ttsContent) {
        return;
      }
      const id = generateChunkId(
        this.#ttsConfig$$().backend,
        item.generateOptions,
      );
      const chunkPath = path.join(ChunkDirName, `${id}.wav`);
      const outputPath = path.join(this.#pythonAddonConfig$$().dir, chunkPath);

      if (!fs.existsSync(outputPath)) {
        try {
          await backendInstance.text2speech(
            item.generateOptions as any,
            outputPath,
          );
        } catch (error) {
          this.log?.warn('文本生成失败');
          this.log?.error(error);
          throw error;
        }
      } else {
        this.log?.info(`使用缓存:`, ttsContent, outputPath);
      }
      const tempAudioList: ContactType[] = [];
      const AudioOptions = item.audioOptions!;
      if (AudioOptions.startInterval) {
        tempAudioList.push({
          type: 'blank',
          duration: AudioOptions.startInterval,
        });
      }
      tempAudioList.push({
        type: 'file',
        filePath: outputPath,
        subtitle: item.subtitle,
        speedControl: AudioOptions!.speedControl,
      });
      if (AudioOptions.endInterval) {
        tempAudioList.push({
          type: 'blank',
          duration: AudioOptions.endInterval,
        });
      }
      audioFilePathList.push(tempAudioList);
      return {
        chunkPath: chunkPath,
      };
    }, 1);
    const errorList: Error[] = [];
    fq.error((error) => {
      if (error) {
        errorList.push(error);
      }
    });
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      fq.push(item).then((result) => {
        this.log?.info(`${i + 1}/${list.length}`);
        options?.progress({
          index: i + 1,
          count: list.length,
          chunkPath: result?.chunkPath!,
        });
        chunkList.push(result?.chunkPath);
      });
    }
    await fq.drained();
    if (errorList.length) {
      this.log?.warn(`出现异常:`, ...errorList);

      throw new Error(errorList.map((item) => item.message).join('\n'));
    }
    const outputPath = path.join(OutputDirName, outputName);
    let outputFilePath = path.join(this.#pythonAddonConfig$$().dir, outputPath);
    this.log?.info(`⏳准备进行语音拼接`);
    this.log?.info(`拼接列表`, audioFilePathList, '输出', outputFilePath);
    audioFilePathList = await this.#plugin.beforeConcat(
      audioFilePathList,
      config,
    );
    await copyConcat(audioFilePathList.flat(), outputFilePath);
    outputFilePath = await this.#plugin.afterConcat(outputFilePath, config);
    this.#idleClean?.start();
    this.log?.info(`拼接完成,保存到=>`, outputFilePath);
    queue.setOutput(chunkList, outputPath);
    return queue.getConfig();
  }
  #getBackend(type: BackendType): TTSBackendImp {
    return this.#injector.get(BackendMap[type] as any);
  }
  #ttsConfig$$ = inject(TTSConfigToken);
  async text2speechItem(options: AudioItemType, outputPath: string) {
    const instance = this.#getBackend(this.#ttsConfig$$().backend);
    const result = await instance.configParser(options);
    return instance.text2speech(result.generateOptions, outputPath);
  }
  #idleClean?: ReturnType<typeof createIdleClean>;

  abortController?: AbortController;
  override checkFilePath$$ = computed(() =>
    process.platform === 'win32'
      ? path.join(this.#pythonAddonConfig$$().dir, 'lib', '.venv', 'python.exe')
      : path.join(
          this.#pythonAddonConfig$$().dir,
          'lib',
          '.venv',
          'bin',
          'python',
        ),
  );
  startFinished$?: Promise<any>;
  instance?: ResultPromise<{}>;

  #execExist() {
    const filePath = this.checkFilePath$$();
    return fs.existsSync(filePath);
  }
  #getChunkSize() {
    if (
      process.platform === 'linux' &&
      (this.#pythonAddonConfig$$().device === 'rocm' ||
        this.#pythonAddonConfig$$().device === 'cuda')
    ) {
      return 2;
    }
    if (
      process.platform === 'win32' &&
      this.#pythonAddonConfig$$().device === 'cuda'
    ) {
      return 2;
    }

    return undefined;
  }
  async downloadPkg(options?: {
    progressMessage?: (item: MessageType) => void;
  }) {
    await this.stop();
    const version = '1.2.2';
    await this.githubRepoDownload(
      {
        prefix: 'wszgrcy/shb-python-addon-repo',
        version: version,
        fileName: `shb-python-addon-${version}-${process.platform}-${process.arch}-${this.#pythonAddonConfig$$().device}.tar.zstd`,
        size: this.#getChunkSize(),
      },
      {
        ...options,
        output: path.join(this.#pythonAddonConfig$$().dir, 'lib'),
        strip: 1,
      },
    );
  }
  async autoCheckDownloadPkg() {
    const exist = this.#execExist();
    if (exist) {
      return;
    }
    this.log?.info('⏳⬇️可执行文件不存在,准备下载');
    await this.downloadPkg({
      progressMessage: (item) => {
        this.log?.info(item);
      },
    });
  }
  async downloadModel(
    backend: BackendType,
    options?:
      | { progressMessage?: ((item: MessageType) => void) | undefined }
      | undefined,
  ) {
    return this.#getBackend(backend).downloadModel(options);
  }
  #getPythonEnv(envDir: string) {
    return process.platform === 'win32'
      ? `${envDir};${path.join(envDir, 'Scripts')};${path.join(envDir, 'Library/bin')};${process.env['PATH']}`
      : `${path.join(envDir, 'bin')}:${process.env['PATH']}`;
  }
  /** rocm 6.3/6.4过慢问题 */
  #getExtraEnv(envDir: string) {
    const ENV_OBJ = {} as Record<string, string>;
    if (process.platform === 'linux') {
      // 未来版本变化需要修改
      ENV_OBJ['PACKAGE_DIR'] = path.join(
        envDir,
        './lib/python3.10/site-packages',
      );
    }
    if (
      process.platform === 'linux' &&
      this.#pythonAddonConfig$$().device === 'rocm'
    ) {
      return {
        ...ENV_OBJ,
        MIOPEN_FIND_MODE: 'FAST',
      };
    }
    return ENV_OBJ;
  }
  async #startup() {
    if (!this.startFinished$) {
      this.startFinished$ = this.autoCheckDownloadPkg().then(async () => {
        const execStart$ = Promise.withResolvers<void>();
        this.log?.info('⏳▶️初始化:准备启动');
        const cwd = path.join(this.#pythonAddonConfig$$().dir, 'lib');
        const envDir = path.join(cwd, '.venv');
        const { instance, abortController } = this.exec(
          'python',
          [
            'main.py',
            '--host',
            this.#pythonAddonConfig$$().host,
            '--port',
            `${this.#pythonAddonConfig$$().port}`,
          ],
          {
            cwd: cwd,
            env: {
              PATH: this.#getPythonEnv(envDir),
              ...this.#getExtraEnv(envDir),
              ...this.#pythonAddonConfig$$().env,
              MODEL_DIR: this.#modelDir$$(),
            },
            extendEnv: true,
          },
        );
        this.instance = instance as any;
        this.abortController = abortController;
        let start = false;
        this.instance!.stdout.on('data', (data) => {
          const content = data.toString() as string;
          this.log?.info(content);
        });
        this.instance!.stderr.on('data', (data) => {
          const content = data.toString() as string;
          if (!start) {
            if (content.includes('running on')) {
              start = true;
              execStart$.resolve();
              this.#idleClean = createIdleClean(() => {
                this.log?.info(
                  `超过${this.#pythonAddonConfig$$().idleTime / 1000}秒未使用,自动停止`,
                );
                this.stop();
              }, this.#pythonAddonConfig$$().idleTime);
              this.#idleClean.start();
              this.start$.next(1);
            }
          }
          this.log?.info(content);
        });
        return execStart$.promise;
      });
    }

    await this.startFinished$;
  }
  override stop(): void {
    if (!this.startFinished$) {
      return;
    }
    this.abortController?.abort();
    this.abortController = undefined;
    this.#idleClean?.stop();
    this.#idleClean = undefined;
    this.startFinished$ = undefined;
    this.instance = undefined;
    this.start$.next(0);
    this.#injector.get(IndexTTSService).clear();
    this.#injector.get(IndexTTSV2Service).clear();
    super.stop();
  }
  override destroy(): void {
    this.stop();
  }
  async clearChunk() {
    this.log?.info(`⏳🗑️准备清理`);
    await Promise.all([
      fs.promises.rm(this.chunk$$(), { recursive: true, force: true }),
    ]);
    this.log?.info(`✅清理完成`);
  }

  override async getVersion(): Promise<string | undefined> {
    if (!this.startFinished$) {
      return undefined;
    }
    await this.startFinished$;
    const filePath = path.join(
      this.#pythonAddonConfig$$().dir,
      'lib',
      'version.txt',
    );
    const versionExist = fs.existsSync(filePath);
    if (!versionExist) {
      return '0.0.0';
    }
    try {
      return await fs.promises.readFile(filePath, { encoding: 'utf-8' });
    } catch (error) {
      this.log?.warn(error);
      return undefined;
    }
  }
}

export class AudioQueue {
  configManger!: ConfigManagerService;
  #config!: TTSFileConfigType & { backend: string };
  #injector;
  lastList = signal([]);
  getConfig() {
    return this.#config;
  }
  setConfig(config: TTSFileConfigType) {
    this.lastList.set(config.list as any);
    this.#config = config as any;
  }
  setOutput(list: (string | undefined)[], bundle: string) {
    this.#config.output = { list, bundle };
  }
  constructor(injector: Injector) {
    this.configManger = injector.get(ConfigManagerService);
    this.#injector = injector;
  }

  getTTSList() {
    return this.#config.list;
  }
  async getParsedList() {
    const config = this.#config;
    const ttsConfig = this.#injector.get(TTSConfigToken)();
    const backend = ttsConfig.backend;
    const service = this.#injector.get(
      BackendMap[backend] as any,
    ) as any as TTSBackendImp;
    return Promise.all(
      this.#config.list.map(async (item) => {
        const result = await service.configParser(deepClone(item), config);
        if (result.audioOptions.isParagraph) {
          result.audioOptions.startInterval ??= 0;
          result.audioOptions.startInterval +=
            config.fileConfig.audioOptions?.paragraphInterval ??
            ttsConfig.audioOptions?.paragraphInterval ??
            0;
        }
        return result;
      }),
    );
  }
}
