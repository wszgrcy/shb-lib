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
              type: 'custom',
            },
          },
          {
            type: 'variable',
            version: 1,
            item: {
              label: 'default2',
              value: ['default2'],
              type: 'custom',
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

describe('entry', () => {
  it('input-params output to text', async () => {
    const injector = createRootInjector({
      providers: [...WORKFLOW_MODULE.provider],
    });
    const service = injector.get(WorkflowParserService);

    const entryNode = {
      id: '1',
      data: {
        config: {
          value: {
            type: 'input-params',
          },
        },
        handle: {
          output: [
            [
              { id: '[default]', label: '[default]', value: '[default]' },
              { id: '[rest]', label: '[rest]', value: '[rest]' },
            ],
            [
              {
                id: '1',
                label: '输出1',
                value: 'default1',
              },
              {
                id: '2',
                label: '输出2',
                value: 'default2',
              },
            ],
          ],
        },
      },
      position: { x: 0, y: 0 },
      type: 'input-params',
    };

    const textNode = {
      id: '2',
      data: {
        config: { value: v.parse(TEXT_NODE_DEFINE, { value: textNodeValue }) },
        handle: {},
      },
      position: { x: 0, y: 0 },
      type: 'textarea',
    };

    const result = service.parse({
      flow: {
        nodes: [entryNode as any, textNode as any],
        edges: [
          {
            id: 'e1',
            source: '1',
            target: '2',
            sourceHandle: '[rest]',
            targetHandle: 'context',
          },
        ],
        viewport: { x: 0, y: 0, zoom: 0 },
      },
    });

    expect(result.data?.end).eq('2');
    const result2 = await injector
      .get(WorkflowExecService)
      .runParse(result.data!, {
        environmentParameters: {
          default1: 'default1-label',
          default2: 'default2-label',
        },
      });
    expect(result2).to.eq('default1-labeldefault2-label');
  });
});
