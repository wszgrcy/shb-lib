import { inject, Provider } from 'static-injector';

import { WorkflowParserService } from './workflow-parser.service';
import { WorkflowRunnerService } from './runner/workflow-runner.service';
import {
  WorkflowRunnerEnvironmentParams,
  WorkflowRunnerInputsWithContext,
  WorkflowStreamData,
} from './share/type2';
import { ChatMessageListInputType } from '@shenghuabi/openai';
import { Subject } from 'rxjs';
import { ContextBuildService } from './preset/context-build.service';
import {
  ResolvedWorkflow,
  WorkflowData,
} from './share/handle-node';
import { Observer } from './share/type';

export class WorkflowExecService {
  #parser = inject(WorkflowParserService);
  #runner = inject(WorkflowRunnerService);
  parse(data: WorkflowData) {
    return this.#parser.parse(data);
  }

  async runParse(...args: Parameters<WorkflowRunnerService['run']>) {
    return this.#runner.run(...args);
  }
  async exec(
    data: Pick<WorkflowData, 'flow'> & { define?: ResolvedWorkflow },
    input: WorkflowRunnerInputsWithContext,
    options: { showError?: boolean },
    ob?: Observer<any, any>,
    abortSignal?: AbortSignal,
    providers?: Provider[],
  ) {
    let define;
    if (data.define) {
      define = data.define;
    } else {
      const res = this.#parser.parse(data);
      if (res.error) {
        throw res.error;
      }
      define = res.data;
    }

    try {
      return await this.runParse(define!, input, ob, abortSignal, providers);
    } catch (error) {
      if (options.showError) {
        // vscode.window.showErrorMessage(errorFormatByNode(error));
        // todo 异常抛出
      }
      throw error;
    }
  }
  #contextBuild = inject(ContextBuildService);
  async agentChat(
    input: {
      // inputs: Record<string, (InputInvalidItem & { value: any })[]>;
      template: ChatMessageListInputType;
      environmentParameters?: WorkflowRunnerEnvironmentParams;
    },
    fn: (item: WorkflowStreamData) => any,
    abort?: AbortSignal,
    providers?: Provider[],
  ) {
    const workflow = this.#contextBuild.createWorkflow(input);
    const subject = new Subject();
    subject.subscribe({
      next: (value) => {
        fn(value as any);
      },
    });
    const result2 = await this.exec(
      { flow: workflow as any },
      {
        // inputs: input.inputs,
        environmentParameters: input.environmentParameters,
      },
      { showError: true },
      subject,
      abort,
      providers,
    );

    return result2;
  }
}
