import { inject } from 'static-injector';
import { TemplateFormatService } from '../template-format.service';
import { WorkflowParserService } from '../workflow-parser.service';
import { ChatMessageListInputType } from '@shenghuabi/openai/define';
/** 对话使用 */
export class ContextBuildService {
  template = inject(TemplateFormatService);
  parser = inject(WorkflowParserService);
  createWorkflow(input: { template: ChatMessageListInputType }) {
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
        config: { value: { value: input.template } },
      },
      type: 'chat',
    };

    return {
      nodes: [chatNode],
      edges: [],
    };
  }
}
