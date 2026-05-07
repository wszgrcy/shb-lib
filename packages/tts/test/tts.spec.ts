import { createRootInjector, Injector, Signal, signal } from 'static-injector';
import { expect } from 'chai';
import { IndexTTSService } from '../indextts.service';
import * as v from 'valibot';
import { IndexTTSOptionsDefine } from '../type/indextts.options.define';
import {
  PythonAddonConfigToken,
  PythonAddonDefine,
  PythonAddonOptions,
} from '../type';
import { TTSSerivce } from '../tts.service';
import { SplitService } from '../split/split.service';
import { ConfigManagerService } from '../config-manager/manager.service';
import fs from 'fs';
import { LogFactoryToken, LogService } from '@cyia/external-call';
import { getCommonProviders } from './util/providers';
import { TTSConfigDefine, TTSConfigToken } from '../type/tts.define';
import { IndexTTSV2Service } from '../indextts.v2.service';
import { path } from '@cyia/vfs2';
describe('tts', () => {
  const DEFAULT_OPTIONS = v.parse(IndexTTSOptionsDefine, {
    generation: {},
    sentence: {},
  });
  const config: PythonAddonOptions = v.parse(PythonAddonDefine, {
    dir: path.join(process.cwd(), '.test-dir'),
  });
  let injector: Injector;
  let configService: ConfigManagerService;
  let paConfig$$: Signal<PythonAddonOptions>;
  beforeEach(async () => {
    await fs.promises.rm(path.join(config.dir, 'output'), {
      recursive: true,
      force: true,
    });
    await fs.promises.rm(path.join(config.dir, 'config.yml'), {
      recursive: true,
      force: true,
    });

    await fs.promises.rm(path.join(config.dir, 'chunk'), {
      recursive: true,
      force: true,
    });
    injector = createRootInjector({
      providers: [
        IndexTTSService,
        IndexTTSV2Service,
        TTSSerivce,
        SplitService,
        ConfigManagerService,
        ...getCommonProviders(),
      ],
    });

    configService = injector.get(ConfigManagerService);
    paConfig$$ = injector.get(PythonAddonConfigToken);
  });
  it.skip('普通文本', async () => {
    const injector = createRootInjector({
      providers: [
        IndexTTSService,
        TTSSerivce,
        SplitService,
        ConfigManagerService,
        ...getCommonProviders(),
        {
          provide: TTSConfigToken,
          useValue: signal({
            ...v.getDefaults(TTSConfigDefine),
            backend: 'IndexTTS-1.5',
          }),
        },
        {
          provide: LogFactoryToken,
          useValue: () => ({
            info: (...args: any) => {
              console.log(...args);
            },
            warn: (...args: any) => {
              console.warn(...args);
            },
            error: (...args: any) => {
              console.error(...args);
            },
          }),
        },
        LogService,
      ],
    });

    const configService = injector.get(ConfigManagerService);
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    await configService.setRef(new Uint8Array(buffer), { language: 'chinese' });
    const ttsService = injector.get(TTSSerivce);

    const queue = await ttsService.getTextScript({
      filePath: '',
      content: `我准备测试文本生成。这是第二句`,
    });
    await ttsService.text2speech(queue.getConfig(), 'output1');
    // const list2 = await ttsService.getTextScript(
    //   `南边来了他大大伯子家的大搭拉尾巴耳朵狗，北边来了他二大伯子家的二搭拉尾巴耳朵狗。他大大伯家的大搭拉尾巴耳朵狗，咬了他二大伯家的二搭拉尾巴耳朵狗一口；他二大伯家的二搭拉尾巴耳朵狗，也咬了他大大伯家的大搭拉尾巴耳朵狗一口。不知是他大大伯家的大搭拉尾巴耳朵狗，先咬了他二大伯家的二搭拉尾巴耳朵狗；还是他二大伯家的二搭拉尾巴耳朵狗，先咬了他大大伯家的大搭拉尾巴耳朵狗。`,
    // );
    // await ttsService.text2speech(list2, 'output1', DEFAULT_OPTIONS);
    expect(fs.existsSync(path.join(config.dir, 'output', 'output1.wav'))).true;
    ttsService.stop();
  });
  it.skip('包含对话', async () => {
    const injector = createRootInjector({
      providers: [
        IndexTTSService,
        TTSSerivce,
        SplitService,
        ConfigManagerService,
        ...getCommonProviders(),
        {
          provide: TTSConfigToken,
          useValue: signal({
            ...v.getDefaults(TTSConfigDefine),
            backend: 'IndexTTS-1.5',
          }),
        },
      ],
    });

    const configService = injector.get(ConfigManagerService);
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    const buffer2 = await fs.promises.readFile(
      'packages/tts/test/fixture/self.wav',
    );
    await configService.setRef(new Uint8Array(buffer), { language: 'chinese' });
    await configService.setRef(new Uint8Array(buffer2), {
      language: 'chinese',
      player: '我',
    });
    const ttsService = injector.get(TTSSerivce);

    const queue = await ttsService.getTextScript({
      filePath: '',
      content: `我听其他人说：“这是第一句。”这是第二句`,
    });
    await ttsService.text2speech(queue as any, 'output1');
    expect(fs.existsSync(path.join(config.dir, 'output', 'output1.wav'))).true;
  });
  it.skip('下载', async () => {
    const injector = createRootInjector({
      providers: [
        IndexTTSService,
        TTSSerivce,
        SplitService,
        ConfigManagerService,
        { provide: PythonAddonConfigToken, useValue: signal(config) },
      ],
    });

    const service = injector.get(TTSSerivce);
    await service.downloadPkg();
    expect(fs.existsSync(path.join(config.dir, './lib'))).true;
    const list = await fs.promises.readdir(path.join(config.dir, './lib'));
    expect(list.length).greaterThan(1);
  });

  it('换行拆分', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    await configService.setRef(new Uint8Array(buffer), { language: 'chinese' });
    const ttsService = injector.get(TTSSerivce);

    const queue = await ttsService.getTextScript({
      filePath: '',
      content: `　　是的烦死了快发是
　　牛逼`,
    });

    expect(queue.getTTSList().length).eq(2);
  });

  it('字幕拆分', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    await configService.setRef(new Uint8Array(buffer), { language: 'chinese' });
    const ttsService = injector.get(TTSSerivce);

    const queue = await ttsService.getSrtScript({
      filePath: '',
      content: `
1
00:00:11,544 --> 00:00:12,682
你好
`,
    });
    const list = queue.getTTSList();
    expect(list.length).eq(1);
    expect(list[0].subtitle!.start).eq(11.544);
  });
  it('start设置0', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    const presetRef = await configService.setRef(new Uint8Array(buffer), {
      language: 'chinese',
    });
    const ttsService = injector.get(TTSSerivce);

    const queue = await ttsService.getSrtScript({
      filePath: '',
      content: `1
00:00:00,000 --> 00:00:03,683
大家好！更新了一个字幕生成语音
`,
    });
    const list = queue.getTTSList();
    expect(list.length).eq(1);
    expect((list[0].generateOptions.reference as any).language).ok;
    expect(list[0].subtitle!.start).eq(0);
  });
  it('默认生成带字幕参数', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    await configService.setRef(new Uint8Array(buffer), { language: 'chinese' });
    const ttsService = injector.get(TTSSerivce);

    const queue = await ttsService.getTextScript({
      filePath: '',
      content: `第一行`,
    });
    const list = queue.getTTSList();
    expect((list[0].generateOptions.reference as any).language).ok;
    expect(list[0].subtitle).ok;
    expect(list[0].subtitle.text).eq('第一行');
  });
  it('带字幕生成参数', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    await configService.setRef(new Uint8Array(buffer), { language: 'chinese' });
    const ttsService = injector.get(TTSSerivce);

    const queue = await ttsService.getSrtScript({
      filePath: '',
      content: `1
00:00:00,000 --> 00:00:03,683
第一行
`,
    });
    const list = queue.getTTSList();
    expect(list[0].subtitle).ok;
    expect(list[0].subtitle.text).eq('第一行');
    expect(list[0].subtitle.start).eq(0);
    expect(list[0].subtitle.end).eq(3.683);
  });

  it('mergedList', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    await configService.setRef(new Uint8Array(buffer), {
      language: 'chinese',
    });
    const setRef = await configService.setRef(new Uint8Array(buffer), {
      player: 'input2',
      language: 'english',
    });
    const ttsService = injector.get(TTSSerivce);
    const queue = await ttsService.getTextScript({
      filePath: '',
      content: `第一句`,
    });
    expect((queue.getTTSList()[0].generateOptions.reference as any).id).eq(
      undefined,
    );
    const list = await queue.getParsedList();
    // todo 解析后
    expect(list[0].generateOptions.reference).ok;
    expect((list[0] as any).generateOptions.commonOptions).ok;
  });
  it('使用情绪引用默认', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );

    const setRef = await configService.setRef(new Uint8Array(buffer), {
      player: 'input2',
      language: 'chinese',
    });

    const ttsService = injector.get(TTSSerivce);
    const queue = await ttsService.getTextScript({
      filePath: '',
      content: `第一句`,
    });

    (queue.getTTSList()[0].generateOptions.emo as any).preset = setRef;
    const list = await queue.getParsedList();
    expect(list[0].generateOptions.emo).deep.eq({
      emo_audio_prompt: path.join(paConfig$$().dir, setRef.filePath),
      emo_alpha: 1,
    });
  });
  it('使用情绪引用定义', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    const setRef = await configService.setRef(new Uint8Array(buffer), {
      player: 'input2',
      language: 'chinese',
    });
    const emoRef = await configService.setIndexTTSRef(
      {
        player: 'input',
        language: 'chinese',
      },
      { emo_vector: [1, 1, 1, 1, 1, 1, 1, 1] },
    );
    const ttsService = injector.get(TTSSerivce);
    const queue = await ttsService.getTextScript({
      filePath: '',
      content: `第一句`,
    });

    (queue.getTTSList()[0].generateOptions.emo as any).preset = emoRef;
    const list = await queue.getParsedList();
    expect(list[0].generateOptions.emo).deep.eq({
      emo_vector: [1, 1, 1, 1, 1, 1, 1, 1],
      use_random: false,
    });
  });
  it('说话的引用', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );

    const Ref = await configService.setRef(buffer, {
      player: 'abc',
      language: 'chinese',
    });
    const emoRef = await configService.setIndexTTSRef(
      {
        player: 'abc',
        language: 'chinese',
      },
      { emo_vector: [1, 1, 1, 1, 1, 1, 1, 1] },
    );
    const ttsService = injector.get(TTSSerivce);
    const queue = await ttsService.getTextScript({
      filePath: '',
      content: `abc说：“这是第一句。”这是第二句`,
    });
    const rList = queue.getTTSList();
    rList[1].generateOptions.emo = { preset: emoRef as any };
    expect((rList[0].generateOptions.reference as any).language).ok;
    expect((rList[1].generateOptions.reference as any).preset).ok;
    expect((rList[1].generateOptions.reference as any).preset).deep.eq({
      player: 'abc',
      language: 'chinese',
      state: 'default',
    });

    const list = await queue.getParsedList();
    expect(typeof list[1].generateOptions.reference === 'string').true;
    expect(list[1].generateOptions.emo).deep.eq({
      emo_vector: [1, 1, 1, 1, 1, 1, 1, 1],
      use_random: false,
    });
  });
  it('自定义引用', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );

    const Ref = await configService.setRef(buffer, {
      player: 'abc',
      language: 'chinese',
    });
    const emoRef = await configService.setIndexTTSRef(
      {
        player: 'abc',
        language: 'chinese',
      },
      { emo_vector: [1, 1, 1, 1, 1, 1, 1, 1] },
    );
    const ttsService = injector.get(TTSSerivce);
    const content = `abc说：“这是第一句。”这是第二句`;
    const queue = await ttsService.getByCustom(async (option) => {
      expect(option.voiceList.length).eq(1);
      expect(option.indextTTSEmoList!.length).eq(1);
      return [
        {
          item: {
            subtitle: { text: '1' },
            generateOptions: {
              audioText: '',
              emo: { emo_alpha: 1 },
              reference: { preset: { state: '', player: '', language: '' } },
            },
            audioOptions: { isParagraph: false },
          },
          metadata: {},
        },
      ];
    });
    const rList = queue.getTTSList();
    expect(rList.length).eq(1);
    expect(rList[0].subtitle.text).eq('1');
    expect(rList[0].origin).ok;
    expect(rList[0].metadata).ok;
  });
  // 情绪使用预设,然后预设中选择的音频的预设
  it('二级情绪引用', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );

    const Ref = await configService.setRef(buffer, {
      player: 'abc',
      language: 'chinese',
    });
    const emoRef = await configService.setIndexTTSRef(
      {
        player: 'abcd',
        language: 'chinese',
      },
      { preset: { player: 'abc', language: 'chinese', state: 'default' } },
    );
    const ttsService = injector.get(TTSSerivce);

    const queue = await ttsService.getTextScript({
      filePath: '',
      content: `abc说：“这是第一句。”这是第二句`,
    });
    queue.getTTSList()[0].generateOptions.emo = {
      preset: { player: 'abcd', language: 'chinese', state: 'default' },
    };
    const rList = await queue.getParsedList();

    expect(rList[0].generateOptions.emo).deep.eq({
      emo_audio_prompt: path.join(paConfig$$().dir, Ref.filePath),
      emo_alpha: 1,
    });
  });

  it('文件级配置', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    await configService.setRef(new Uint8Array(buffer), {
      language: 'chinese',
    });
    const setRef = await configService.setRef(new Uint8Array(buffer), {
      player: 'input2',
      language: 'english',
    });
    const ttsService = injector.get(TTSSerivce);
    const queue = await ttsService.getTextScript({
      filePath: '',
      content: `第一句`,
    });
    queue.getConfig().fileConfig.audioOptions = {
      speedControl: { mode: 'fixed', ratio: 1.5 },
    };
    expect((queue.getTTSList()[0].generateOptions.reference as any).id).eq(
      undefined,
    );
    const list = await queue.getParsedList();
    expect(list[0].generateOptions.reference).ok;
    expect((list[0] as any).generateOptions.commonOptions).ok;
    expect(list[0].audioOptions.speedControl).deep.eq({
      mode: 'fixed',
      ratio: 1.5,
    });
  });
});
