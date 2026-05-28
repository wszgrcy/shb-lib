import { expect } from 'chai';
import { createRootInjector } from 'static-injector';
import { WorkflowParserService } from '../workflow-parser.service';
import { TEXT_NODE_DEFINE } from '../inline/node/text/text.node.define';
import * as v from 'valibot';
import { WorkflowExecService } from '../workflow-exec.service';
import { WORKFLOW_MODULE } from '../module';
import { CustomNode } from '../share';
import { InlineNodeService } from '../inline/inline.service';
import { TextInputTestConfig } from './util/text-input/main';
import { SimplifiedState } from '@shenghuabi/lexical-textarea';
import { serializeLexicalTextarea } from '../util/serialize-text-template';
import type { ChatMetadata } from '../share/type';
const systemP = [[{ text: '123', type: 'text' }]] as SimplifiedState;
describe('hello', () => {
  it('hello', async () => {
    const injector = createRootInjector({
      providers: [...WORKFLOW_MODULE.provider],
    });
    const service = injector.get(WorkflowParserService);
    const textNode: CustomNode = {
      id: '1',
      data: {
        config: { value: v.parse(TEXT_NODE_DEFINE, { value: systemP }) },
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
      type: 'textarea',
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
      .runParse(result.data!, {});
    expect(result2).deep.eq('123');
  });
  it('refList', async () => {
    const injector = createRootInjector({
      providers: [...WORKFLOW_MODULE.provider],
    });
    const inlineNode = injector.get(InlineNodeService);
    inlineNode.register({
      'text-input': TextInputTestConfig,
    });
    const service = injector.get(WorkflowParserService);
    const textNode: CustomNode = {
      id: '1',
      data: {
        config: { value: { value: '123456' } },
        handle: {
          output: [
            [
              {
                id: 'output-2',
                label: '输出',
                name: 'default',
              },
            ],
          ],
        },
      },
      position: { x: 0, y: 0 },
      type: 'text-input',
    };
    const textNode2: CustomNode = {
      id: '2',
      data: {
        config: {
          value: {},
          refList: [{ key: ['value'], value: '1', outlet: 'output-2' }],
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
      type: 'text-input',
    };

    const result = service.parse({
      flow: {
        nodes: [textNode, textNode2],
        edges: [
          {
            id: 'edge-1',
            source: '1',
            target: '2',
            sourceHandle: 'output-2',
            targetHandle: 'input:value',
          },
        ],
        viewport: { x: 0, y: 0, zoom: 0 },
      },
    });
    expect(result.data?.end).eq('2');
    const result2 = await injector
      .get(WorkflowExecService)
      .runParse(result.data!, {});
    expect(result2).deep.eq('123456');
  });

  it('invalidConfigList and contextConfigList extraction', () => {
    const injector = createRootInjector({
      providers: [...WORKFLOW_MODULE.provider],
    });
    const service = injector.get(WorkflowParserService);

    const textNode: CustomNode = {
      id: '1',
      data: {
        config: {
          value: v.parse(TEXT_NODE_DEFINE, { value: systemP }),
          invalidList: [{ key: ['field1'] }, { key: ['field2'] }],
          contextGroup: {
            group1: [
              { label: 'Context 1', key: ['ctx', '1'] },
              { label: 'Context 2', key: ['ctx', '2'] },
            ],
          },
        },
        handle: {
          output: [
            [
              {
                id: 'output-1',
                label: '输出',
                name: 'default',
              },
            ],
          ],
        },
      },
      position: { x: 0, y: 0 },
      type: 'textarea',
    };

    const textNode2: CustomNode = {
      id: '2',
      data: {
        config: {
          invalidList: [{ key: ['field3'] }],
          contextGroup: {
            group1: [
              { label: 'Context 2', key: ['ctx', '2'] }, // 重复项，应该被去重
              { label: 'Context 3', key: ['ctx', '3'] },
            ],
            group2: [{ label: 'Context 4', key: ['ctx', '4'], kind: 'image' }],
          },
        },
        handle: {
          output: [
            [
              {
                id: 'output-2',
                label: '输出',
                name: 'default',
              },
            ],
          ],
        },
      },
      position: { x: 0, y: 0 },
      type: 'textarea',
    };

    const result = service.parse({
      flow: {
        nodes: [textNode, textNode2],
        edges: [
          {
            id: 'edge-1',
            source: '1',
            target: '2',
            sourceHandle: 'output-1',
            targetHandle: 'input:value',
          },
        ],
        viewport: { x: 0, y: 0, zoom: 0 },
      },
    });

    // 验证无效配置提取
    expect(result.invalidConfigList).to.have.length(2);
    expect(result.invalidConfigList![0].id).eq('1');
    expect(result.invalidConfigList![0].list).to.have.length(2);
    expect(result.invalidConfigList![1].id).eq('2');
    expect(result.invalidConfigList![1].list).to.have.length(1);

    // 验证上下文配置提取和去重
    // 总共有6个上下文项，其中Context 2 (key: ['ctx', '2']) 重复，所以去重后为4个
    expect(result.contextConfigList).to.have.length(4);

    // 验证去重后的上下文配置
    const contextKeys = result.contextConfigList!.map((item) =>
      JSON.stringify(item.key),
    );
    expect(contextKeys).to.include(JSON.stringify(['ctx', '1']));
    expect(contextKeys).to.include(JSON.stringify(['ctx', '2']));
    expect(contextKeys).to.include(JSON.stringify(['ctx', '3']));
    expect(contextKeys).to.include(JSON.stringify(['ctx', '4']));

    // 确保没有重复的 key
    const uniqueKeys = new Set(contextKeys);
    expect(uniqueKeys.size).eq(contextKeys.length);
  });

  it('empty invalidConfigList and contextConfigList when nodes have no config', () => {
    const injector = createRootInjector({
      providers: [...WORKFLOW_MODULE.provider],
    });
    const service = injector.get(WorkflowParserService);

    const textNode: CustomNode = {
      id: '1',
      data: {
        config: {
          value: v.parse(TEXT_NODE_DEFINE, { value: systemP }),
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
      type: 'textarea',
    };

    const result = service.parse({
      flow: {
        nodes: [textNode],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 0 },
      },
    });

    // 验证空配置列表
    expect(result.invalidConfigList).to.have.length(0);
    expect(result.contextConfigList).to.have.length(0);
  });

  describe('serializeLexicalTextarea', () => {
    it('should handle array context values with strings and objects with ref', () => {
      const metadataCollector: ChatMetadata[] = [];
      const input = [
        [{ type: 'variable' as const, item: { label: 'array', value: ['array'] } }],
      ] as SimplifiedState;
      const context = {
        array: [
          'string item 1',
          { toString: () => 'object item', ref: { type: 'knowledge', knowledgeName: 'kn1', fileName: 'f1' } },
          'string item 2',
        ],
      };

      const result = serializeLexicalTextarea(input, {
        context,
        environmentContext: {},
        onMetadata: (meta) => metadataCollector.push(...meta),
      });

      expect(result).to.eq('string item 1\nobject item\nstring item 2');
      expect(metadataCollector).to.have.length(1);
      expect(metadataCollector[0]!.type).to.eq('knowledge');
    });

    it('should handle array with multiple refs', () => {
      const metadataCollector: ChatMetadata[] = [];
      const input = [
        [{ type: 'variable' as const, item: { label: 'array', value: ['array'] } }],
      ] as SimplifiedState;
      const context = {
        array: [
          { toString: () => 'obj1', ref: { type: 'dict', word: 'w1', content: 'c1' } },
          { toString: () => 'obj2', ref: [{ type: 'url', title: 't1', url: 'http://x' }] },
        ],
      };

      const result = serializeLexicalTextarea(input, {
        context,
        environmentContext: {},
        onMetadata: (meta) => metadataCollector.push(...meta),
      });

      expect(result).to.eq('obj1\nobj2');
      expect(metadataCollector).to.have.length(2);
    });

    it('should handle plain string as before', () => {
      const metadataCollector: ChatMetadata[] = [];
      const input = [
        [{ type: 'variable' as const, item: { label: 'str', value: ['str'] } }],
      ] as SimplifiedState;
      const context = { str: 'plain string' };

      const result = serializeLexicalTextarea(input, {
        context,
        environmentContext: {},
        onMetadata: (meta) => metadataCollector.push(...meta),
      });

      expect(result).to.eq('plain string');
      expect(metadataCollector).to.have.length(0);
    });

    it('should handle object with ref as before', () => {
      const metadataCollector: ChatMetadata[] = [];
      const input = [
        [{ type: 'variable' as const, item: { label: 'obj', value: ['obj'] } }],
      ] as SimplifiedState;
      const context = {
        obj: { toString: () => 'obj text', ref: { type: 'card', fileName: 'card1.md' } },
      };

      const result = serializeLexicalTextarea(input, {
        context,
        environmentContext: {},
        onMetadata: (meta) => metadataCollector.push(...meta),
      });

      expect(result).to.eq('obj text');
      expect(metadataCollector).to.have.length(1);
      expect(metadataCollector[0]!.type).to.eq('card');
    });
  });
});
