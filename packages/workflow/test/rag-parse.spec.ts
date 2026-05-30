import { expect } from 'chai';
import { createRootInjector } from 'static-injector';
import { WorkflowParserService } from '../workflow-parser.service';
import { WORKFLOW_MODULE } from '../module';
import { WorkflowData } from '../share';

const workflowJson = {
  flow: {
    nodes: [
      {
        position: { x: 275, y: 200 },
        id: '14aace43-54b7-48a3-a9cd-a15e2d991007',
        data: {
          handle: {
            output: [
              [{ id: '[default]', label: '默认', name: 'default' }],
              [{ id: 'format', label: '格式化', name: 'format' }],
            ],
          },
          config: {
            value: {},
            refList: [],
            invalidList: [],
            contextGroup: { value: [] },
          },
          transform: { resizable: true },
          value: [{ role: 'system', content: [] }],
          title: '对话',
        },
        width: 970,
        type: 'chat',
        measured: { width: 970, height: 646 },
        height: 646,
        resizing: false,
        className: '',
      },
      {
        position: { x: -105, y: 450 },
        id: '56fa0b2c-06a0-44f2-9a6b-c204f6f0f829',
        data: {
          handle: {
            output: [
              [
                { id: '[default]', label: '默认', name: 'default' },
                { id: '[rest]', label: '展开', name: 'rest' },
              ],
              [{ label: '问题', name: 'question', id: 'question' }],
            ],
          },
          config: {
            refList: [],
            value: {},
            invalidList: [],
          },
          title: '外界输入',
        },
        type: 'input-params',
        measured: { width: 298, height: 164 },
        dragging: false,
        className: '',
      },
    ],
    edges: [
      {
        source: '56fa0b2c-06a0-44f2-9a6b-c204f6f0f829',
        sourceHandle: 'question',
        target: '14aace43-54b7-48a3-a9cd-a15e2d991007',
        targetHandle: '[context]',
        markerEnd: { type: 'arrowclosed', strokeWidth: 2 },
        interactionWidth: 4,
        id: '1',
      },
    ],
    viewport: {
      x: 0,
      y: 0,
      zoom: 0,
    },
  },
  version: 0,
  update: 0,
} as WorkflowData;
// 顺序问题
describe('rag-parse', () => {
  it('should parse workflow with rag node successfully', async () => {
    const injector = createRootInjector({
      providers: [...WORKFLOW_MODULE.provider],
    });
    const service = injector.get(WorkflowParserService);

    const result = service.parse(workflowJson);
    expect(result).ok;
    expect(result.error).not.ok;
  });
});
