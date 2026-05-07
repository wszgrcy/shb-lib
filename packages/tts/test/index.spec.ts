import { createRootInjector } from 'static-injector';
import { expect } from 'chai';
import { IndexTTSService } from '../indextts.service';
import path from 'node:path';
import * as v from 'valibot';
import { IndexTTSOptionsDefine } from '../type/indextts.options.define';
import { PythonAddonDefine, PythonAddonOptions } from '../type';
import fs from 'fs';
import { getCommonProviders } from './util/providers';
describe('indextts', () => {
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
      providers: [IndexTTSService, ...getCommonProviders()],
    });
    const service = injector.get(IndexTTSService);
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
        } as any,

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
        } as any,
        outputPath2,
      ),
    ]);
    expect(fs.existsSync(outputPath1)).true;
    expect(fs.existsSync(outputPath2)).true;
  });
  it.skip('下载模型', async () => {
    const injector = createRootInjector({
      providers: [IndexTTSService, ...getCommonProviders()],
    });

    const service = injector.get(IndexTTSService);

    await service.downloadModel({
      progressMessage(item) {
        console.log(item.type, item.data);
      },
    });
  });
});
