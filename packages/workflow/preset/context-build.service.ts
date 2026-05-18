import { inject } from 'static-injector';
import { TemplateFormatService } from '../template-format.service';
import { WorkflowParserService } from '../workflow-parser.service';
import { ChatMessageListInputType } from '@shenghuabi/openai/define';
/** 对话使用 */
export class ContextBuildService {
  template = inject(TemplateFormatService);
  parser = inject(WorkflowParserService);
  createWorkflow(
    input: {
      template: ChatMessageListInputType;
      input: Record<string, any>;
    },
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

    /** 自建出口 */
    const chatNode = {
      id: '2',
      data: {
        title: '',
        handle: {
          output: [
            [
              {
                id: '1',
                label: '',
                value: 'default',
              },
            ],
          ],
        },
        value: input.template,
        config: {},
      },
      type: 'chat',
    };

    return {
      nodes: [chatNode],
    };
  }
}
