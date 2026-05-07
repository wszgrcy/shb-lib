import { createRootInjector, Injector, signal } from 'static-injector';
import { expect } from 'chai';
import { IndexTTSService } from '../indextts.service';
import path from 'node:path';
import * as v from 'valibot';
import { IndexTTSOptionsDefine } from '../type/indextts.options.define';
import { PythonAddonDefine, PythonAddonOptions } from '../type';
import { TTSPluginSerivce, TTSSerivce } from '../tts.service';
import { SplitService } from '../split/split.service';
import { ConfigManagerService } from '../config-manager/manager.service';
import fs from 'fs';
import { getCommonProviders } from './util/providers';
import { TTSConfigDefine, TTSConfigToken } from '../type/tts.define';
describe('plugin', () => {
  const DEFAULT_OPTIONS = v.parse(IndexTTSOptionsDefine, {
    generation: {},
    sentence: {},
  });
  const config: PythonAddonOptions = v.parse(PythonAddonDefine, {
    dir: path.join(process.cwd(), '.test-dir'),
  });
  let injector: Injector;
  let configService: ConfigManagerService;
  beforeEach(async () => {
    await fs.promises.rm(path.join(config.dir, 'output'), {
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
        TTSSerivce,
        SplitService,
        ConfigManagerService,
        ...getCommonProviders(),
        {
          provide: TTSConfigToken,
          useValue: signal(
            v.parse(TTSConfigDefine, {
              plugin: { activatedChangeAudioItemList: [{ name: 'p1' }] },
            }),
          ),
        },
      ],
    });

    configService = injector.get(ConfigManagerService);
  });

  it('插件测试', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    await configService.setRef(new Uint8Array(buffer), { language: 'chinese' });
    const ttsService = injector.get(TTSSerivce);
    const pluginService = injector.get(TTSPluginSerivce);
    pluginService.registerAudioItem({
      name: 'p1',
      priority: 0,
      fn: async (item) => {
        item.generateOptions.audioText = `input-${item.subtitle.text}`;
        return item;
      },
    });
    const queue = await ttsService.getTextScript(
      { filePath: '', content: `第一句。我说：“第二句。”第三句。` },
      undefined,
    );

    expect(queue.getTTSList().length).eq(3);

    for (const item of queue.getTTSList()) {
      expect(item.generateOptions.audioText).eq(`input-${item.subtitle.text}`);
      expect(item.origin.generateOptions.audioText).not.eq(
        `input-${item.subtitle.text}`,
      );
    }
  });
  it('字幕', async () => {
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    await configService.setRef(new Uint8Array(buffer), { language: 'chinese' });
    const ttsService = injector.get(TTSSerivce);
    const pluginService = injector.get(TTSPluginSerivce);
    pluginService.registerAudioItem({
      name: 'p1',
      priority: 0,
      fn: async (item) => {
        item.generateOptions.audioText = `input-${item.subtitle.text}`;
        return item;
      },
    });
    const queue = await ttsService.getSrtScript(
      {
        filePath: '',
        content: `1
00:00:11,544 --> 00:00:12,682
你好
  `,
      },
      undefined,
    );
    const list = queue.getTTSList();
    expect(list.length).eq(1);
    for (const item of queue.getTTSList()) {
      expect(item.generateOptions.audioText).eq(`input-${item.subtitle.text}`);
      expect(item.origin.generateOptions.audioText).not.eq(
        `input-${item.subtitle.text}`,
      );
    }
    const item = pluginService.reset(queue.getTTSList()[0] as any);
    expect(item.generateOptions.audioText).eq('你好');
  });
});
