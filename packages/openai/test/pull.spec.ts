import { createRootInjector, signal } from 'static-injector';
import { createChatStream, OpenAIConfig, OpenAIConfigToken } from '../index';
import { expect } from 'chai';

describe.skip('openai', () => {
  it('测试异常', async () => {
    let isPull = false;
    const injector = createRootInjector({
      providers: [
        {
          provide: OpenAIConfigToken,
          useValue: signal({
            tryPull() {
              return true;
            },
            async pullModel(name) {
              expect(name).eq('coder1');
              isPull = true;
            },
          } as OpenAIConfig),
        },
      ],
    });
    const chat = createChatStream({
      provider: 'openai-completions',
      model: 'coder1',
      config: { baseUrl: 'http://amd395:12345/v1' },
      apiKey: 'cyia',
    });
    const list = chat({ messages: [] }, undefined, { injector });
    for await (const item of list) {
    }
    expect(isPull).true;
  });
});
