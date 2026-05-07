import { inject } from 'static-injector';
import { TemplateFormatService } from '../template-format.service';
import { WorkflowParserService } from '../workflow-parser.service';
import { uniq } from 'es-toolkit';
import { InlineInputItemRunner } from '../runner/inline-input-item.runner';
import { WorkflowNodeType } from '../share/workflow.const';
import { ChatMessageListInputType } from '@shenghuabi/openai/define';
import { generateHandle } from '../share/util';
import { DEFAULT_INPUT_KEY } from '../share/const';
/** 对话使用 */
export class ContextBuildService {
  template = inject(TemplateFormatService);
  parser = inject(WorkflowParserService);
  createWorkflow(
    input: {
      template: ChatMessageListInputType;
      input: Record<string, any>;
      context: any;
    },
    inlineMode: boolean,
  ) {
    // 每一个输入都变成一个节点
    const result = this.template
      .parse(
        input.template
          .flatMap((item) =>
            item.content.map((item) => (item.type === 'text' ? item.text : '')),
          )
          .join('\n'),
      )
      .list.map((item) => item.value);
    // 改成一个input(所有的进入)输入
    const inputList = [
      uniq([
        ...Object.keys({ ...input.input, ...input.context }),
        ...result,
      ]).map((value, i) => ({
        id: `${i}`,
        value: value,
        label: ``,
      })),
    ];

    /** 自建出口 */
    const chatNode = {
      id: '2',
      data: {
        title: '对话',
        handle: {
          input: inputList,
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
        value: input.template,
        config: {},
      },
      type: 'chat',
    };
    if (!inlineMode) {
      return {
        nodes: [chatNode],
        edges: [],
      };
    }
    /** 自建入口 */
    const inputParamsNode = {
      id: '1',
      type: WorkflowNodeType.inputParams,
      data: {
        handle: {
          input: [
            [
              {
                ...generateHandle(DEFAULT_INPUT_KEY, ''),
                inputType: 'object',
              },
            ],
          ],
          output: [[{ id: '1', value: 'default', label: '' }]],
        },
      },
    };
    /** 自建中间节点 */
    const bridgeNodeList = inputList.flat().map((item, i) => ({
      id: `${InlineInputItemRunner.runnerName}-${i}`,
      type: InlineInputItemRunner.runnerName,
      data: {
        handle: {
          input: [[{ id: '1', value: item.value, label: '' }]],
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
    }));
    const bridgeEdgeList1 = inputList.flat().map((item, i) => ({
      source: inputParamsNode.id,
      sourceHandle: '1',
      target: `${InlineInputItemRunner.runnerName}-${i}`,
      targetHandle: '1',
    }));
    const bridgeEdgeList2 = inputList.flat().map((item, i) => ({
      source: `${InlineInputItemRunner.runnerName}-${i}`,
      sourceHandle: '1',
      target: chatNode.id,
      targetHandle: item.id,
    }));
    return {
      nodes: [inputParamsNode, chatNode, ...bridgeNodeList],
      edges: [...bridgeEdgeList1, ...bridgeEdgeList2],
    };
  }
}
