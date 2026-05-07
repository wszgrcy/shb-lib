import { inject } from 'static-injector';
import { TemplateFormatService } from '../template-format.service';
import { WorkflowParserService } from '../workflow-parser.service';
import { ParametersRunner } from '../runner/parameters.runner';
import { RawWorkflowNode } from '../share/handle-node';

export class InlineBuilderService {
  template = inject(TemplateFormatService);
  parser = inject(WorkflowParserService);
  #createLLMNode(input: {
    input: Record<string, any>;
    context: any;
  }): RawWorkflowNode {
    return {
      id: '1',
      data: {
        handle: {
          input: [
            Object.keys({ ...input.input, ...input.context }).map(
              (value, i) => ({
                id: `${i}`,
                value: value,
                label: ``,
              }),
            ),
          ],
          output: [
            [
              {
                id: '1',
                label: '',
                value: '输出',
              },
            ],
          ],
        },
      },
      type: ParametersRunner.runnerName,
    };
  }
  #createEdge(
    llmNode: RawWorkflowNode,
    context: Record<string, RawWorkflowNode>,
  ) {
    const edgeList: {
      source: string;
      sourceHandle: string;
      target: string;
      targetHandle: string;
    }[] = [];
    const addEdge = (node: RawWorkflowNode) => {
      const inputHandleList = node.data.handle?.input.flat() || [];
      for (const inputHandle of inputHandleList) {
        const item = context[inputHandle.value];
        if (!item) {
          continue;
        }
        // todo 其实应该可以选择的
        // 必须存在至少一个输出,否则没法返回
        const sourceHandle = item.data.handle!.output[0][0];
        edgeList.push({
          source: item.id,
          sourceHandle: sourceHandle!.id,
          // 自身
          target: node.id,
          targetHandle: inputHandle.id,
        });
      }
    };
    for (const ctxKey in context) {
      const node = context[ctxKey];
      addEdge(node);
    }
    addEdge(llmNode);

    return edgeList;
  }
  #createWorkflow(input: { input: Record<string, any>; context: any }) {
    const chatNode = this.#createLLMNode(input);
    const edges = this.#createEdge(chatNode, input.context);
    return {
      nodes: [chatNode, ...Object.values(input.context)],
      edges: edges,
    };
  }
  createDefine(input: {
    input: Record<string, any>;
    context: Record<string, any>;
  }) {
    return this.parser.parse({ flow: this.#createWorkflow(input) as any });
  }
}
