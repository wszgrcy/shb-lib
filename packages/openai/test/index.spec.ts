import { expect } from 'chai';
import {
  ChangeDetectionScheduler,
  ChangeDetectionSchedulerImpl,
  createRootInjector,
  effect,
  signal,
} from 'static-injector';
import {
  ChatProviderService,
  OPENAI_MODULE,
  OpenAIConfig,
  OpenAIConfigToken,
} from '..';
import { path } from '@cyia/vfs2';
import { ChatHistoryService } from '../chat/chat.history.service';
import fs from 'fs';
import { parse } from 'yaml';
const ChatDefaultConfig = { vendor: 'openai' as const };
describe('openai', () => {
  const decoder = new TextDecoder();

  const autoPull = async (model: string) =>
    fetch('http://localhost:11434/api/pull', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
      }),
    })
      .then((a) => {
        const reader = a.body!.getReader();
        return new ReadableStream({
          start(controller) {
            return pump();
            function pump(): any {
              return reader.read().then(({ done, value }) => {
                console.log(decoder.decode(value));
                if (done) {
                  controller.close();
                  return;
                }
                controller.enqueue(value);
                return pump();
              });
            }
          },
        });
      })
      .then((stream) => new Response(stream))
      .then((response) => response.blob());
  const historyDir = path.join(process.cwd(), '.tmp', 'history');
  beforeEach(async () => {
    await fs.promises.rm(historyDir, { force: true, recursive: true });
  });
  it.skip('chat', async () => {
    const injector = createRootInjector({
      providers: [
        {
          provide: OpenAIConfigToken,
          useValue: signal({
            pullModel: autoPull,
            history: {
              enable: false,
            },
          }),
        },
        ChatProviderService,
        ChatHistoryService,
      ],
    });
    const instance = injector.get(ChatProviderService);
    const result = instance.create({
      ...ChatDefaultConfig,
      baseURL: 'http://127.0.0.1:11434/v1',
      model: 'qwen3:0.6b',
    });
    const data = result.stream({
      messages: [{ role: 'user', content: [{ text: '1', type: 'text' }] }],
    });
    for await (const item of data) {
      expect(typeof item.content).eq('string');
      expect(typeof item.delta).eq('string');
      expect(typeof item.isThinking).eq('boolean');
    }
  });
  it('chat error', async () => {
    const injector = createRootInjector({
      providers: [
        {
          provide: OpenAIConfigToken,
          useValue: signal({
            history: {
              enable: false,
            },
          }),
        },
        ChatProviderService,
        ChatHistoryService,
      ],
    });
    const instance = injector.get(ChatProviderService);
    const result = instance.create({
      ...ChatDefaultConfig,
      baseURL: 'http://127.0.0.1:11434/v1',
      model: 'xqwen3:0.6b',
    });
    const data = result.stream({
      messages: [{ role: 'user', content: [{ text: '1', type: 'text' }] }],
    });
    try {
      for await (const item of data) {
        console.log(item);
      }
    } catch (error) {
      expect(error).instanceOf(Error);
    }
  });
  it.skip('chat pull error', async () => {
    const injector = createRootInjector({
      providers: [
        {
          provide: OpenAIConfigToken,
          useValue: signal({
            pullModel: () => {},
            history: {
              enable: false,
            },
          }),
        },
        ChatProviderService,
        ChatHistoryService,
      ],
    });
    const instance = injector.get(ChatProviderService);
    const result = instance.create({
      ...ChatDefaultConfig,
      baseURL: 'http://127.0.0.1:11434/v1',
      model: 'xqwen3:0.6b',
    });
    const data = result.stream({
      messages: [{ role: 'user', content: [{ text: '1', type: 'text' }] }],
    });
    try {
      for await (const item of data) {
        console.log(item);
      }
    } catch (error) {
      expect(error).instanceOf(Error);
    }
  });
  it.skip('no think chat', async () => {
    const injector = createRootInjector({
      providers: [
        {
          provide: OpenAIConfigToken,
          useValue: signal({
            pullModel: autoPull,
            history: {
              enable: false,
            },
          }),
        },
        ChatProviderService,
        ChatHistoryService,
      ],
    });
    const instance = injector.get(ChatProviderService);
    const result = instance.create({
      ...ChatDefaultConfig,
      baseURL: 'http://127.0.0.1:11434/v1',
      model: 'qwen2.5:0.5b-base-q3_K_S',
    });
    const data = result.stream({
      messages: [{ role: 'user', content: [{ text: '1', type: 'text' }] }],
    });
    for await (const item of data) {
      expect(typeof item.content).eq('string');
      expect(typeof item.delta).eq('string');
      expect(item.isThinking).eq(false);
      break;
    }
  });
  it.skip('chat history', async () => {
    const injector = createRootInjector({
      providers: [
        {
          provide: OpenAIConfigToken,
          useValue: signal({
            pullModel: autoPull,
            history: {
              dir: path.join(process.cwd(), '.tmp', 'history'),
              enable: true,
            },
          } as OpenAIConfig),
        },
        ChatProviderService,
        ChatHistoryService,
        {
          provide: ChangeDetectionScheduler,
          useClass: ChangeDetectionSchedulerImpl,
        },
      ],
    });
    const instance = injector.get(ChatProviderService);
    const result = instance.create({
      ...ChatDefaultConfig,
      baseURL: 'http://127.0.0.1:11434/v1',
      model: 'qwen3:0.6b',
    });
    const data = result.stream({
      messages: [
        { role: 'user', content: [{ text: 'please return 1', type: 'text' }] },
      ],
    });
    for await (const item of data) {
      // expect(typeof item.content).eq('string');
      // expect(typeof item.delta).eq('string');
      // expect(item.isThinking).eq(true);
      // break;
    }
    const ref = effect(
      () => {
        const update = injector.get(ChatHistoryService).update$$();
        if (update === 1) {
          const list = fs.promises.readdir(historyDir);
          list.then(async (list) => {
            expect(list.length).eq(1);
            const filePath = path.join(historyDir, list[0]);
            const data = parse(
              await fs.promises.readFile(filePath, { encoding: 'utf-8' }),
            );
            expect(data.length).eq(1);
            ref.destroy();
          });
        }
      },
      { injector: injector },
    );
  });
  it.skip('默认参数解析', async () => {
    const injector = createRootInjector({
      providers: [
        ...OPENAI_MODULE.provider,
        {
          provide: OpenAIConfigToken,
          useValue: signal({
            pullModel: autoPull,
            history: {
              enable: false,
            },
          }),
        },
        ChatProviderService,
        ChatHistoryService,
      ],
    });
    const instance = injector.get(ChatProviderService);
    const result = instance.create({
      model: 'v1',
      baseURL: 'https://aa.bb.cc',
    });
  });
});
