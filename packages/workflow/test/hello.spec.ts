import { expect } from 'chai';
import { createRootInjector } from 'static-injector';
import { WorkflowParserService } from '../workflow-parser.service';
import { TEXT_NODE_DEFINE } from '../inline/node/text/text.node.define';
import * as v from 'valibot';
import { WorkflowExecService } from '../workflow-exec.service';
import { WORKFLOW_MODULE } from '../module';
import { CustomNode } from '../share';
import { createTextTemplate } from './util/chat-fixture';
import { InlineNodeService } from '../inline/inline.service';
import { TextInputTestConfig } from './util/text-input/main';
const systemP = createTextTemplate([[{ text: '123' }]]);
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
});
