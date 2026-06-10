import { expect } from 'chai';
import {
  complete,
  stream,
  fauxAssistantMessage,
  fauxText,
  fauxThinking,
} from '@earendil-works/pi-ai';
import { registerMockProvider, createDynamicResponse } from '../index';

// --- 类型守卫：安全访问文本内容 ---
const isTextContent = (block: {
  type?: string;
}): block is { type: 'text'; text: string } => block.type === 'text';

describe('openai', () => {
  let mockProvider: ReturnType<typeof registerMockProvider>;

  afterEach(() => {
    mockProvider?.unregister();
  });

  describe('faux provider', () => {
    it('应该能够接受数据并正常发射响应（简单字符串）', async () => {
      mockProvider = registerMockProvider();
      mockProvider.setResponses([fauxAssistantMessage('hello world')]);

      const response = await complete(mockProvider.model, {
        messages: [
          { role: 'user', content: 'hi there', timestamp: Date.now() },
        ],
      });

      expect(response.content).to.have.lengthOf(1);
      expect(response.content[0].type).to.equal('text');
      if (isTextContent(response.content[0])) {
        expect(response.content[0].text).to.equal('hello world');
      }
    });

    it('应该支持流式输出', async () => {
      mockProvider = registerMockProvider({ tokensPerSecond: 100 });
      mockProvider.setResponses([fauxAssistantMessage('streaming test')]);

      const chunks: string[] = [];
      for await (const event of stream(mockProvider.model, {
        messages: [{ role: 'user', content: 'hi', timestamp: Date.now() }],
      })) {
        if (event.type === 'text_delta') {
          chunks.push(event.delta);
        }
      }

      expect(chunks.length).to.be.greaterThan(0);
      const fullText = chunks.join('');
      expect(fullText).to.equal('streaming test');
    });

    it('应该支持 thinking 内容', async () => {
      mockProvider = registerMockProvider();
      mockProvider.setResponses([
        fauxAssistantMessage([
          fauxThinking('让我思考一下...'),
          fauxText('答案是 42'),
        ]),
      ]);

      const response = await complete(mockProvider.model, {
        messages: [
          { role: 'user', content: 'question', timestamp: Date.now() },
        ],
      });

      expect(response.content).to.have.lengthOf(2);
      expect(response.content[0].type).to.equal('thinking');
      expect(
        (response.content[0] as unknown as { thinking: string }).thinking,
      ).to.equal('让我思考一下...');
      expect(response.content[1].type).to.equal('text');
    });

    it('应该支持多轮调用，每次返回不同响应', async () => {
      mockProvider = registerMockProvider();
      mockProvider.setResponses([
        fauxAssistantMessage('第一次调用'),
        fauxAssistantMessage('第二次调用'),
        fauxAssistantMessage('第三次调用'),
      ]);

      const r1 = await complete(mockProvider.model, {
        messages: [{ role: 'user', content: 'round 1', timestamp: Date.now() }],
      });
      if (isTextContent(r1.content[0]))
        expect(r1.content[0].text).to.equal('第一次调用');

      // 多轮调用 round 2 - 使用 fauxAssistantMessage 创建正确的消息类型
      const r2 = await complete(mockProvider.model, {
        messages: [
          { role: 'user' as const, content: 'round 1', timestamp: Date.now() },
          fauxAssistantMessage('第一次调用'),
          { role: 'user' as const, content: 'round 2', timestamp: Date.now() },
        ],
      });
      if (isTextContent(r2.content[0]))
        expect(r2.content[0].text).to.equal('第二次调用');

      const r3 = await complete(mockProvider.model, {
        messages: [
          { role: 'user' as const, content: 'round 1', timestamp: Date.now() },
          fauxAssistantMessage('第一次调用'),
          { role: 'user' as const, content: 'round 2', timestamp: Date.now() },
          fauxAssistantMessage('第二次调用'),
          { role: 'user' as const, content: 'round 3', timestamp: Date.now() },
        ],
      });
      if (isTextContent(r3.content[0]))
        expect(r3.content[0].text).to.equal('第三次调用');
    });

    describe('createDynamicResponse', () => {
      it('应该根据用户输入动态生成响应', async () => {
        mockProvider = registerMockProvider();
        const factory = createDynamicResponse((context, callCount) => {
          const lastMessage = context.messages[context.messages.length - 1];
          return `收到第 ${callCount} 轮请求，用户输入: ${lastMessage.content}`;
        });

        mockProvider.setResponses([factory]);

        const response = await complete(mockProvider.model, {
          messages: [
            { role: 'user', content: '你好世界', timestamp: Date.now() },
          ],
        });

        if (isTextContent(response.content[0])) {
          expect(response.content[0].text).to.include('第 1 轮请求');
          expect(response.content[0].text).to.include('你好世界');
        }
      });

      it('应该在多次调用时递增 callCount', async () => {
        mockProvider = registerMockProvider();
        const factory = createDynamicResponse(
          (_context, callCount) => `call #${callCount}`,
        );

        // 预置3个响应，每次 complete 消耗一个
        mockProvider.setResponses([factory, factory, factory]);

        for (let i = 1; i <= 3; i++) {
          const response = await complete(mockProvider.model, {
            messages: [
              { role: 'user', content: `request ${i}`, timestamp: Date.now() },
            ],
          });
          if (isTextContent(response.content[0]))
            expect(response.content[0].text).to.equal(`call #${i}`);
        }
      });

      it('应该返回多个文本块', async () => {
        mockProvider = registerMockProvider();
        const factory = createDynamicResponse((_context, _callCount) => [
          '第一块文本',
          '第二块文本',
        ]);

        mockProvider.setResponses([factory]);

        const response = await complete(mockProvider.model, {
          messages: [{ role: 'user', content: 'multi', timestamp: Date.now() }],
        });

        expect(response.content).to.have.lengthOf(2);
        if (isTextContent(response.content[0]))
          expect(response.content[0].text).to.equal('第一块文本');
        if (isTextContent(response.content[1]))
          expect(response.content[1].text).to.equal('第二块文本');
      });

      it('应该忽略输入参数，统一返回预设响应', async () => {
        mockProvider = registerMockProvider();
        const factory = createDynamicResponse(
          () =>
            // 完全忽略 context，统一返回固定内容
            '固定的模拟回答',
        );

        // 预置3个相同响应，每次 complete 消耗一个
        mockProvider.setResponses([factory, factory, factory]);

        for (const input of ['你好', '你是谁', '今天天气怎么样']) {
          const response = await complete(mockProvider.model, {
            messages: [{ role: 'user', content: input, timestamp: Date.now() }],
          });
          if (isTextContent(response.content[0]))
            expect(response.content[0].text).to.equal('固定的模拟回答');
        }
      });

      it('应该支持流式动态响应', async () => {
        mockProvider = registerMockProvider({ tokensPerSecond: 100 });
        const factory = createDynamicResponse(
          (_context, callCount) => `stream response #${callCount}`,
        );

        mockProvider.setResponses([factory]);

        const chunks: string[] = [];
        for await (const event of stream(mockProvider.model, {
          messages: [
            { role: 'user', content: 'stream', timestamp: Date.now() },
          ],
        })) {
          if (event.type === 'text_delta') {
            chunks.push(event.delta);
          }
        }

        expect(chunks.length).to.be.greaterThan(0);
        expect(chunks.join('')).to.equal('stream response #1');
      });
    });
  });
});
