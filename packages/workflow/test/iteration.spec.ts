import { expect } from 'chai';
import { createRootInjector } from 'static-injector';
import { WorkflowParserService } from '../workflow-parser.service';
import * as v from 'valibot';
import { WorkflowExecService } from '../workflow-exec.service';
import { WORKFLOW_MODULE } from '../module';
import { TEXT_NODE_DEFINE } from '../inline/node/text/text.node.define';

const textNodeValue = {
  root: {
    children: [
      {
        children: [
          {
            type: 'variable',
            version: 1,
            item: {
              label: 'default1',
              value: ['default1'],
            },
          },
          {
            type: 'variable',
            version: 1,
            item: {
              label: 'default2',
              value: ['default2'],
            },
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
        textFormat: 0,
        textStyle: '',
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

describe('iteration', () => {
  it('hello', async () => {
    const injector = createRootInjector({
      providers: [...WORKFLOW_MODULE.provider],
    });
    const service = injector.get(WorkflowParserService);

    const iterationNode = {
      id: '3',
      data: {
        config: { value: {}, invalidList: [{ key: ['list'] }] },
        handle: {},
      },
      position: { x: 0, y: 0 },
      type: 'iteration',
    };
    const iterationStartNode = {
      id: '4',
      data: {
        config: { value: {} },
        handle: {
          output: [
            [
              { id: 'item[default]', value: 'item', type: 'default' },
              { id: 'item[rest]', value: 'item', type: 'rest' },
            ],
            [
              { id: 'index[default]', type: 'default', value: 'index' },
              { id: 'index[rest]', type: 'rest', value: 'index' },
            ],
          ],
        },
      },
      position: { x: 0, y: 0 },
      type: 'iteration-start',
      parentId: '3',
    };

    const textNode2 = {
      id: '5',
      data: {
        config: { value: v.parse(TEXT_NODE_DEFINE, { value: textNodeValue }) },
        handle: {
          output: [],
        },
      },
      position: { x: 0, y: 0 },
      type: 'textarea',
    };

    const result = service.parse({
      flow: {
        nodes: [iterationNode as any, iterationStartNode, textNode2],
        edges: [
          // iteration-start → textNode2: 传递 context (list 参数)
          {
            id: 'e1',
            source: '4',
            target: '5',
            sourceHandle: 'item[rest]',
            targetHandle: 'context',
          },
        ],
        viewport: { x: 0, y: 0, zoom: 0 },
      },
    });

    expect(result.data?.end).eq('3');
    const result2 = await injector
      .get(WorkflowExecService)
      .runParse(result.data!, {
        input: {
          '3': [
            {
              key: ['list'],
              value: [
                { default1: 'default1-label', default2: 'default2-label' },
              ],
            },
          ],
        },
      });
    expect(result2).deep.eq(['default1-labeldefault2-label']);
  });
});
