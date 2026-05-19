import { expect } from 'chai';
import { createRootInjector } from 'static-injector';
import { WorkflowParserService } from '../workflow-parser.service';
import { TEXT_NODE_DEFINE } from '../inline/node/text/text.node.define';
import * as v from 'valibot';
import { WorkflowExecService } from '../workflow-exec.service';
import { WORKFLOW_MODULE } from '../module';
import { InlineNodeService } from '../inline/inline.service';
import { TextMainConfig } from '../inline/node/text/main';
import { WorkflowPluginService } from '../plugin/plugin.service';
const systemP = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '123',
            type: 'text',
            version: 1,
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
const textNode = {
  id: '1',
  data: {
    config: { value: v.parse(TEXT_NODE_DEFINE, { value: systemP }) },
    handle: {
      output: [
        [
          {
            id: '2',
            label: '输出',
            value: 'default',
          },
        ],
      ],
    },
  },
  position: { x: 0, y: 0 },
  type: 'textarea-reg',
};
describe('node-registry', () => {
  it('inline', async () => {
    const injector = createRootInjector({
      providers: [...WORKFLOW_MODULE.provider],
    });
    const service = injector.get(WorkflowParserService);
    const inlineNode = injector.get(InlineNodeService);
    inlineNode.register({
      'textarea-reg': { ...TextMainConfig, type: 'textarea-reg' },
    });

    const result = service.parse({
      flow: {
        nodes: [textNode as any],
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
  it('plugin', async () => {
    const injector = createRootInjector({
      providers: [...WORKFLOW_MODULE.provider],
    });
    const service = injector.get(WorkflowParserService);
    const inlineNode = injector.get(WorkflowPluginService);
    inlineNode.setNodeObject([{ ...TextMainConfig, type: 'textarea-reg' }]);

    const result = service.parse({
      flow: {
        nodes: [textNode as any],
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
});
