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
  let decoder = new TextDecoder();

  const autoPull = async (model: string) => {
    return fetch('http://localhost:11434/api/pull', {
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
  };
  const historyDir = path.join(process.cwd(), '.tmp', 'history');
  beforeEach(async () => {
    await fs.promises.rm(historyDir, { force: true, recursive: true });
  });
  it.skip('chat', async () => {
    let injector = createRootInjector({
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
    let instance = injector.get(ChatProviderService);
    let result = instance.create({
      ...ChatDefaultConfig,
      baseURL: 'http://127.0.0.1:11434/v1',
      model: 'qwen3:0.6b',
    });
    let data = result.stream({
      messages: [{ role: 'user', content: [{ text: '1', type: 'text' }] }],
    });
    for await (const item of data) {
      expect(typeof item.content).eq('string');
      expect(typeof item.delta).eq('string');
      expect(typeof item.isThinking).eq('boolean');
    }
  });
  it('chat error', async () => {
    let injector = createRootInjector({
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
    let instance = injector.get(ChatProviderService);
    let result = instance.create({
      ...ChatDefaultConfig,
      baseURL: 'http://127.0.0.1:11434/v1',
      model: 'xqwen3:0.6b',
    });
    let data = result.stream({
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
    let injector = createRootInjector({
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
    let instance = injector.get(ChatProviderService);
    let result = instance.create({
      ...ChatDefaultConfig,
      baseURL: 'http://127.0.0.1:11434/v1',
      model: 'xqwen3:0.6b',
    });
    let data = result.stream({
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
    let injector = createRootInjector({
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
    let instance = injector.get(ChatProviderService);
    let result = instance.create({
      ...ChatDefaultConfig,
      baseURL: 'http://127.0.0.1:11434/v1',
      model: 'qwen2.5:0.5b-base-q3_K_S',
    });
    let data = result.stream({
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
    let injector = createRootInjector({
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
    let instance = injector.get(ChatProviderService);
    let result = instance.create({
      ...ChatDefaultConfig,
      baseURL: 'http://127.0.0.1:11434/v1',
      model: 'qwen3:0.6b',
    });
    let data = result.stream({
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
    let ref = effect(
      () => {
        let update = injector.get(ChatHistoryService).update$$();
        if (update === 1) {
          let list = fs.promises.readdir(historyDir);
          list.then(async (list) => {
            expect(list.length).eq(1);
            let filePath = path.join(historyDir, list[0]);
            let data = parse(
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
    let injector = createRootInjector({
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
    let instance = injector.get(ChatProviderService);
    let result = instance.create({
      model: 'v1',
      baseURL: 'https://aa.bb.cc',
    });
  });
});
