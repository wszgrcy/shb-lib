import { expect } from 'chai';
import { createRootInjector } from 'static-injector';
import { WorkflowParserService } from '../workflow-parser.service';
import * as v from 'valibot';
import { WorkflowExecService } from '../workflow-exec.service';
import { CHAT_NODE_DEFINE } from '../inline/node/chat/node.define';
import { ChatServiceToken } from '../token';
import { LogFactoryToken, LogService } from '@cyia/external-call';
import { WORKFLOW_MODULE } from '../module';
import { CustomNode } from '../share';
import { createTextTemplate } from './util/chat-fixture';

const systemP = createTextTemplate([[{ text: 'systemP' }]]);

const userP = createTextTemplate([
  [
    { text: 'userP' },
    { label: 'userInput', value: ['userInput'], type: 'custom' },
  ],
]);
describe('chat', () => {
  it('hello', async () => {
    class ChatService {
      chat(config: any) {
        return {
          stream: async function* (data: any) {
            expect(data.messages[1].content[0].text).eq(`userPinputValue`);
            let content = '';
            for (let i = 0; i < 10; i++) {
              content += `${i}`;
              yield { content: content };
            }
          },
        };
      }
      getMetadataEndRef() {
        return '';
      }
    }
    const injector = createRootInjector({
      providers: [
        ...WORKFLOW_MODULE.provider,
        { provide: ChatServiceToken, useClass: ChatService },
        {
          provide: LogFactoryToken,
          useValue: (value: string) => ({
            info: console.info,
            warn: console.warn,
            error: console.error,
          }),
        },
        LogService,
      ],
    });
    const service = injector.get(WorkflowParserService);
    const textNode: CustomNode = {
      id: '1',
      data: {
        config: {
          value: v.parse(CHAT_NODE_DEFINE, {
            value: [
              { role: 'system', content: [{ type: 'text', text: systemP }] },
              {
                role: 'user',
                content: [{ type: 'text', text: userP }],
              },
            ],
          }),
        },
        handle: {
          output: [
            [
              {
                id: '2',
                label: '输出',
                name: 'default',
              },
            ],
          ],
        },
      },
      position: { x: 0, y: 0 },
      type: 'chat',
    };
    const result = service.parse({
      flow: {
        nodes: [textNode],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 0 },
      },
    });
    expect(result.data?.end).eq('1');
    const result2 = await injector
      .get(WorkflowExecService)
      .runParse(result.data!, {
        environmentParameters: { userInput: 'inputValue' },
      });
    expect(result2).eq('0123456789');
    // expect(result2.extra.historyList.slice(-1)[0].content[0].text).eq(
    //   '0123456789',
    // );
  });
});
