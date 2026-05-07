import { expect } from 'chai';
import { createRootInjector, signal } from 'static-injector';
import { WorkflowParserService } from '../workflow-parser.service';
import { WorkflowExecService } from '../workflow-exec.service';
import { ChatServiceToken, WorkflowConfigToken } from '../token';
import { LogFactoryToken, LogService } from '@cyia/external-call';
import { WorkflowSelectService } from '../workflow-select.service';
import { path } from '@cyia/vfs2';
import { WORKFLOW_MODULE } from '../module';
describe('workflow-file', () => {
  it('hello', async () => {
    class ChatService {
      chat(config: any) {
        return {
          stream: async function* (data: any) {
            expect(data.messages.length).eq(1);
            expect(data.messages[0].content[0].text).contain('english');
            expect(data.messages[0].content[0].text).contain('中文');
            let content = '';
            for (let i = 0; i < 10; i++) {
              content += `${i}`;
              yield { content: content };
            }
          },
        };
      }
      getMetadataEndRef() {
        return '';
      }
    }
    const injector = createRootInjector({
      providers: [
        ...WORKFLOW_MODULE.provider,
        { provide: ChatServiceToken, useClass: ChatService },
        {
          provide: LogFactoryToken,
          useValue: (value: string) => ({
            info: console.info,
            warn: console.warn,
            error: console.error,
          }),
        },
        LogService,
        {
          provide: WorkflowConfigToken,
          useValue: signal({
            dir: path.join(process.cwd(), './packages/workflow/test/fixture'),
          }),
        },
      ],
    });
    const workflowSelect = injector.get(WorkflowSelectService);
    const workflowItem = await workflowSelect.get({
      workflowName: 'chinese-to',
    });
    const service = injector.get(WorkflowParserService);

    const result = service.parse(workflowItem);
    const result2 = await injector
      .get(WorkflowExecService)
      .runParse(result.data!, {
        input: { target_language: 'english', source_text: '中文' },
      });
    expect(result2.value).eq('0123456789');
  });
  it('工作流文件查询', async () => {
    const injector = createRootInjector({
      providers: [
        ...WORKFLOW_MODULE.provider,
        {
          provide: LogFactoryToken,
          useValue: (value: string) => ({
            info: console.info,
            warn: console.warn,
            error: console.error,
          }),
        },
        LogService,
        {
          provide: WorkflowConfigToken,
          useValue: signal({
            dir: path.join(process.cwd(), './packages/workflow/test/fixture'),
          }),
        },
      ],
    });
    const workflowSelect = injector.get(WorkflowSelectService);
    const list = await workflowSelect.getList();
    expect(list.length).greaterThan(1);

    expect(list.some((item) => item.relPath === 'chinese-to')).true;
  });
});
