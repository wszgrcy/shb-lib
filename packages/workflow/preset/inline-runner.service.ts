import { inject } from 'static-injector';
import { InlineBuilderService } from './inline-build.service';
import { WorkflowRunnerService } from '../runner/workflow-runner.service';
import { WorkflowRunnerEnvironmentParams } from '../share/type2';
import { ChatModelOptions } from '@shenghuabi/openai';

export class InlineParametersService {
  #inlineBuild = inject(InlineBuilderService);
  #workflowRunner = inject(WorkflowRunnerService);
  async run(input: {
    input?: Record<string, any>;
    context?: Record<string, any>;
    modelOptions?: ChatModelOptions;
    environmentParameters?: WorkflowRunnerEnvironmentParams;
  }) {
    const define = this.#inlineBuild.createDefine({
      ...input,
      input: input.input ?? {},
      context: input.context ?? {},
    });
    const result2 = await this.#workflowRunner.run(define.data!, {
      input: new Map(
        Object.entries(input.input || {}).map(([key, value]) => [
          key,
          { value: value },
        ]),
      ),
      environmentParameters: input.environmentParameters,
      modelOptions: input.modelOptions,
    });
    return result2 as { value: Record<string, { value: any; extra?: any }> };
  }
}
