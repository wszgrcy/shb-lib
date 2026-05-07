import { createRootInjector, signal } from 'static-injector';
import { expect } from 'chai';
import { IndexTTSService } from '../indextts.service';
import path from 'node:path';
import * as v from 'valibot';
import { IndexTTSOptionsDefine } from '../type/indextts.options.define';
import {
  PythonAddonConfigToken,
  PythonAddonDefine,
  PythonAddonOptions,
} from '../type';
import fs from 'fs';
import { LogFactoryToken, LogService } from '@cyia/external-call';
import { IndexTTSV2Service } from '../indextts.v2.service';
import { TTSSerivce } from '../tts.service';
import { SplitService } from '../split/split.service';
import { ConfigManagerService } from '../config-manager/manager.service';
import { getCommonProviders } from './util/providers';
describe('indextts.v2', () => {
  const DEFAULT_OPTIONS = v.parse(IndexTTSOptionsDefine, {
    generation: {},
    sentence: {},
  });
  const config: PythonAddonOptions = v.parse(PythonAddonDefine, {
    dir: path.join(process.cwd(), '.test-dir'),
  });
  beforeEach(async () => {
    await fs.promises.rm(path.join(config.dir, 'output'), {
      recursive: true,
      force: true,
    });
    await fs.promises.rm(path.join(config.dir, 'chunk'), {
      recursive: true,
      force: true,
    });
  });
  it.skip('调用对话', async () => {
    const injector = createRootInjector({
      providers: [
        IndexTTSV2Service,
        ...getCommonProviders(),
        LogService,
        {
          provide: LogFactoryToken,
          useValue: () => ({
            info: (...args: any[]) => {
              console.log(...args);
            },
            warn: (...args: any[]) => {
              console.log(...args);
            },
            error: (...args: any[]) => {
              console.log(...args);
            },
          }),
        },
      ],
    });
    const service = injector.get(IndexTTSV2Service);
    const outputPath1 = path.join(config.dir, 'output', 'output1.wav');
    const outputPath2 = path.join(config.dir, 'output', 'output2.wav');
    await Promise.all([
      service.text2speech(
        {
          reference: path.join(
            process.cwd(),
            './packages/tts/test/fixture',
            'reference_voice.wav',
          ),
          audioText: '你好',
          commonOptions: DEFAULT_OPTIONS,
          emo: { emo_alpha: 1 },
        },

        outputPath1,
      ),
      service.text2speech(
        {
          reference: path.join(
            process.cwd(),
            './packages/tts/test/fixture',
            'reference_voice.wav',
          ),
          audioText: '我是好人',
          commonOptions: DEFAULT_OPTIONS,
          emo: { emo_alpha: 1 },
        },
        outputPath2,
      ),
    ]);
    expect(fs.existsSync(outputPath1)).true;
    expect(fs.existsSync(outputPath2)).true;
  });
  it.skip('下载模型', async () => {
    const injector = createRootInjector({
      providers: [IndexTTSV2Service, ...getCommonProviders()],
    });

    const service = injector.get(IndexTTSV2Service);

    await service.downloadModel({
      progressMessage(item) {
        console.log(item.type, item.data);
      },
    });
  });

  it.skip('服务器启动+对话', async () => {
    const injector = createRootInjector({
      providers: [
        IndexTTSService,
        IndexTTSV2Service,
        TTSSerivce,
        SplitService,
        ConfigManagerService,
        ...getCommonProviders(),
        {
          provide: PythonAddonConfigToken,
          useValue: signal({ ...config, device: 'zluda' }),
        },
        LogService,
        {
          provide: LogFactoryToken,
          useValue: () => ({
            info: (...args: any[]) => {
              console.log(...args);
            },
            warn: (...args: any[]) => {
              console.log(...args);
            },
            error: (...args: any[]) => {
              console.log(...args);
            },
          }),
        },
      ],
    });

    const configService = injector.get(ConfigManagerService);
    const buffer = await fs.promises.readFile(
      'packages/tts/test/fixture/reference_voice.wav',
    );
    await configService.setRef(new Uint8Array(buffer), { language: 'chinese' });

    const ttsService = injector.get(TTSSerivce);
    // 没有包时下载用
    // await ttsService.downloadPkg({
    //   progressMessage: (item) => {
    //     console.log(item);
    //   },
    // });

    const queue = await ttsService.getTextScript({
      filePath: '',
      content: `测试语句1`,
    });

    queue.getTTSList().forEach((item) => {
      item.generateOptions = { ...item.generateOptions, emo: { emo_alpha: 1 } };
    });
    await ttsService.text2speech(queue.getConfig(), 'output1');
    expect(fs.existsSync(path.join(config.dir, 'output', 'output1.wav'))).true;
    ttsService.stop();
  });
});
