import {
  ChangeDetectionScheduler,
  ChangeDetectionSchedulerImpl,
  computed,
  createRootInjector,
  effect,
} from 'static-injector';
import { expect } from 'chai';
import { LlamaSwapService } from '../llama-swap.service';
import path from 'path';
import * as fs from 'fs';
import { LogFactoryToken, LogService } from '@cyia/external-call';
import {
  HUGGINGFACE_TOKEN_TOKEN,
} from '@cyia/external-call';
import { getCommonProvider } from './util/provider';
import { existsSync } from 'fs';
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
            exec: { version: 'b9587', device: 'cpu' },
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
    expect(result.model).eq('huggingface.co/unsloth/Qwen3-0.6B-GGUF:UD-IQ1_M');
  });
  it('customArgs 应该被正确拼接到命令中', async () => {
    const dir = path.join(process.cwd(), '.tmp', 'llama-test-customargs');
    await fs.promises.mkdir(dir, { recursive: true });
    const injector = createRootInjector({
      providers: [
        LlamaSwapService,
        ...getCommonProvider(),
        LogService,
        {
          provide: LogFactoryToken,
          useValue: () => ({
            info: (...args: any[]) => {},
            warn: (...args: any[]) => {},
            error: (...args: any[]) => {},
          }),
        },
        {
          provide: ChangeDetectionScheduler,
          useClass: ChangeDetectionSchedulerImpl,
        },
        {
          provide: HUGGINGFACE_TOKEN_TOKEN,
          useValue: computed(() => undefined),
        },
      ],
    });
    const instance = injector.get(LlamaSwapService);

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
                'gpu-layers': {
                  enable: true,
                  value: [999],
                },
              },
            },
            exec: { version: 'b9587', device: 'cpu' },
            model: 'test-model',
            customArgs: ['--log-disable', '--my-custom-flag', '--port', '8888'],
          },
        ],
      },
    });

    const config = await instance.getLlamaSwapConfig();
    expect(config).ok;
    expect(config!.models['test-model']).ok;
    expect(config!.models['test-model'].cmd).include('--flash-attn');
    expect(config!.models['test-model'].cmd).include('on');
    expect(config!.models['test-model'].cmd).include('--log-disable');
    expect(config!.models['test-model'].cmd).include('--my-custom-flag');
    expect(config!.models['test-model'].cmd).include('--port');
    expect(config!.models['test-model'].cmd).include('8888');

    // 验证 customArgs 在最后位置（在常规参数之后）
    const cmd = config!.models['test-model'].cmd;
    const regularFlagIndex = cmd.indexOf('--flash-attn');
    const customFlagIndex = cmd.indexOf('--log-disable');
    expect(customFlagIndex).to.be.greaterThan(regularFlagIndex);
  });
});
