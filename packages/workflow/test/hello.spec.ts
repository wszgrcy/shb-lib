import { expect } from 'chai';
import { createRootInjector } from 'static-injector';
import { WorkflowParserService } from '../workflow-parser.service';
import { TEXT_NODE_DEFINE } from '../inline/node/text/text.node.define';
import * as v from 'valibot';
import { WorkflowExecService } from '../workflow-exec.service';
import { WORKFLOW_MODULE } from '../module';
describe('hello', () => {
  it('hello', async () => {
    const injector = createRootInjector({ providers: [...WORKFLOW_MODULE.provider,] });
    const service = injector.get(WorkflowParserService);
    const textNode = v.parse(TEXT_NODE_DEFINE, {
      id: '1',
      data: {
        value: '123',
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
      type: 'textarea',
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
    expect(result2).deep.eq({ value: '123' });
  });
});
