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
import { SimplifiedState } from '@shenghuabi/lexical-textarea';

const systemP: SimplifiedState = [[{ text: 'systemP', type: 'text' }]];

const userP: SimplifiedState = [
  [
    { text: 'userP', type: 'text' },
    {
      item: { label: 'userInput', value: ['userInput'], type: 'custom' },
      type: 'variable',
    },
  ],
];
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
                id: '[default]',
                label: '输出',
                name: '[default]',
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
    expect(result.editorInput).not.ok;
    expect(result.data?.end).eq('1');
    const result2 = await injector
      .get(WorkflowExecService)
      .runParse(result.data!, {
        environmentParameters: { userInput: 'inputValue' },
      });
    expect(result2).eq('0123456789');
    textNode.data.outputHandleId = 'historyList';
    const result3 = await injector
      .get(WorkflowExecService)
      .runParse(result.data!, {
        environmentParameters: { userInput: 'inputValue' },
      });
    expect(result3.length).eq(3);
    expect(result3[2].content[0].text).eq('0123456789');
  });

  it('默认输出outputId', async () => {
    class ChatService {
      chat(config: any) {
        return {
          stream: async function* (data: any) {
            let content = '';
            for (let i = 0; i < 10; i++) {
              content += `${i}`;
              yield { content: content, delta: `${i}` };
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

    const result2 = await injector.get(WorkflowExecService).runParse(
      {
        nodes: {
          '8447135a-19ce-4e64-be0a-b6aa87b441bc': {
            data: {
              handle: {
                output: [
                  [
                    { id: '[default]', label: '默认', name: 'default' },
                    { id: '[rest]', label: '展开', name: 'rest' },
                  ],
                  [{ label: '选中内容', name: 'selection', id: 'selection' }],
                ],
              },
              config: {
                refList: [],
                value: { type: '' },
                invalidList: [],
              },
              title: '外界输入',
            },
            outputs: [
              { id: '[default]', label: '默认', name: 'default' },
              { id: '[rest]', label: '展开', name: 'rest' },
              { label: '选中内容', name: 'selection', id: 'selection' },
            ],
            type: 'input-params',
            id: '8447135a-19ce-4e64-be0a-b6aa87b441bc',
            context: [],
          },
          'ded5022b-11f8-41e2-9f01-ca9076687671': {
            data: {
              handle: {
                output: [
                  [{ id: '[default]', label: '默认', name: 'default' }],
                  [{ id: 'format', label: '格式化', name: 'format' }],
                ],
              },
              config: {
                value: {
                  value: [],
                },
                refList: [],
                invalidList: [],
                contextGroup: { value: [] },
              },
              title: '对话',
            },
            outputs: [
              { id: '[default]', label: '默认', name: 'default' },
              { id: 'format', label: '格式化', name: 'format' },
            ],
            type: 'chat',
            id: 'ded5022b-11f8-41e2-9f01-ca9076687671',
            context: [
              {
                id: '8447135a-19ce-4e64-be0a-b6aa87b441bc',
                handleId: 'selection',
                output: 'selection',
                rest: false,
              },
            ],
          },
        },
        end: 'ded5022b-11f8-41e2-9f01-ca9076687671',
      } as any,
      {
        environmentParameters: {
          selection: '',
        },
      },
    );
    console.log(result2);
    expect(result2).eq('0123456789');
  });
  it('jsonSchema', async () => {
    class ChatService {
      chat(config: any) {
        return {
          stream: async function* (data: any) {
            // 验证 json_schema 被正确传递到 stream
            expect(data.response_format).to.deep.equal({
              type: 'json_schema',
              json_schema: {
                name: 'testSchema',
                schema: {
                  type: 'object',
                  properties: { a: { type: 'string' } },
                },
              },
            });
            // mock 输出 JSON 字符串（完整内容）
            const jsonStr = '{"a":"xxxxx"}';
            yield { content: jsonStr };
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
            jsonSchema: {
              name: 'testSchema',
              schema: {
                type: 'object',
                properties: {
                  a: { type: 'string' },
                },
              },
            } as any,
          }),
        },
        handle: {
          output: [
            [
              {
                id: '2',
                label: '输出',
                name: '[default]',
              },
            ],
          ],
        },
        outputHandleId: 'format',
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
    // format 输出应该解析 rawContent
    // textNode.data.outputHandleId = 'format';
    const result2 = await injector
      .get(WorkflowExecService)
      .runParse(result.data!, {
        environmentParameters: { userInput: 'inputValue' },
      });
    console.log('result2:', result2);
    expect(result2).to.deep.equal({ a: 'xxxxx' });
  });
  it('agentChat', async () => {
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

    const result2 = await injector.get(WorkflowExecService).agentChat(
      {
        environmentParameters: { userInput: 'inputValue' },
        template: [
          { role: 'system', content: [{ type: 'text', text: systemP as any }] },
          {
            role: 'user',
            content: [{ type: 'text', text: userP as any }],
          },
        ],
      },
      () => {},
    );
    expect(result2).eq('0123456789');
    // expect(result2.extra.historyList.slice(-1)[0].content[0].text).eq(
    //   '0123456789',
    // );
  });
});
