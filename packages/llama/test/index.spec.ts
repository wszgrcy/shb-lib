import {
  ChangeDetectionScheduler,
  ChangeDetectionSchedulerImpl,
  computed,
  createRootInjector,
  effect,
  signal,
} from 'static-injector';
import { expect } from 'chai';
import { LlamaSwapService } from '../llama-swap.service';
import { LLamaConfigToken, OLLAMA_MODEL_URL_TOKEN } from '../token';
import path from 'path';
import { existsSync } from 'fs';
import {
  DownloadConfigToken,
  GITHUB_URL_TOKEN,
  LogFactoryToken,
  LogService,
} from '@cyia/external-call';
import { getCommonProvider } from './util/provider';
describe('template', () => {
  it.skip('启动', async () => {
    const dir = path.join(process.cwd(), '.tmp', 'llama');
    const injector = createRootInjector({
      providers: [
        LlamaSwapService,
        ...getCommonProvider(),
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
        {
          provide: ChangeDetectionScheduler,
          useClass: ChangeDetectionSchedulerImpl,
        },
      ],
    });
    const instance = injector.get(LlamaSwapService);

    await instance.downloadExec('v119');

    let result = existsSync(path.join(dir, 'llama-swap'));
    expect(result).eq(true);
    await instance.writeConfig({
      server: {
        list: [
          {
            config: {
              common: {
                'flash-attn': {
                  enable: true,
                  value: ['on'],
                },
                model: {
                  enable: true,
                  value: [
                    'C:/Users/chen/.ollama/models/blobs/sha256-c5396e06af294bd101b30dce59131a76d2b773e76950acc870eda801d3ab0515',
                  ],
                },
              },
            },
            exec: { version: 'b5415', device: 'cpu' },
            model: 'qwen2.5:0.5b',
          },
        ],
      },
    });
    result = existsSync(path.join(dir, 'llama-swap.config.yml'));
    expect(result).eq(true);
    instance.init();

    const a = effect(
      () => {
        const result = instance.start$();
        if (result) {
          (async () => {
            expect(result).eq(true);
            const version = await instance.getVersion();
            expect(version).ok;
            a.destroy();
            instance.stop();
          })();
        }
      },
      { injector: injector },
    );
  });
  it.skip('下载模型返回配置', async () => {
    const injector = createRootInjector({
      providers: [
        LlamaSwapService,
        ...getCommonProvider(),
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
        {
          provide: ChangeDetectionScheduler,
          useClass: ChangeDetectionSchedulerImpl,
        },
      ],
    });
    const instance = injector.get(LlamaSwapService);
    const result = await instance.createModelConfig(
      'huggingface.co/unsloth/Qwen3-0.6B-GGUF:UD-IQ1_M',
    );
    expect(result.model).eq(
      'huggingface.co/unsloth/Qwen3-0.6B-GGUF:UD-IQ1_M',
    );
  });
});
