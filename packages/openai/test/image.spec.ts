import { fauxAssistantMessage, ImageContent } from '@earendil-works/pi-ai';
import { createChatStream, registerMockProvider } from '../index';
import { expect } from 'chai';

describe('openai-image', () => {
  let mockProvider: ReturnType<typeof registerMockProvider>;

  afterEach(() => {
    mockProvider?.unregister();
  });

  it('图片处理', async () => {
    mockProvider = registerMockProvider();
    mockProvider.setResponses([
      (context) => {
        expect(context.messages).ok;
        expect(context.messages.length).ok;
        expect(context.messages[0].content[0]).deep.eq({
          data: 'xxxx',
          mimeType: 'image/png',
          type: 'image',
        } satisfies ImageContent);
        return fauxAssistantMessage('hello world');
      },
    ]);
    const chatStream = createChatStream({
      provider: mockProvider.model.provider as any,
      config: mockProvider.model as any,
      model: '',
    });
    const result = chatStream({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: 'data:image/png;base64,xxxx' },
            },
          ],
        },
      ],
    });
    let result2;
    for await (const item of result) {
      if (item.type === 'done') {
        result2 = item;
      }
    }
    expect(result2!.message.content.length).ok;
  });
});
