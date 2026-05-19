import { inject } from 'static-injector';

import { WorkflowParserService } from './workflow-parser.service';
import { WorkflowRunnerService } from './runner/workflow-runner.service';
import {
  WorkflowRunnerEnvironmentParams,
  WorkflowStreamData,
} from './share/type2';
import { ChatMessageListInputType } from '@shenghuabi/openai';
import { Subject } from 'rxjs';
import { ContextBuildService } from './preset/context-build.service';
import {
  InputInvalidItem,
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

  async runParse(
    define: ResolvedWorkflow,
    input: {
      input?: Record<string, (InputInvalidItem & { value: any })[]>;
      environmentParameters?: WorkflowRunnerEnvironmentParams;
    },
    ob?: Observer<any, any>,
    abortSignal?: AbortSignal,
  ) {
    return this.#runner.run(
      define!,
      {
        inputs: input.input ?? {},
        environmentParameters: input.environmentParameters,
      },
      ob,
      abortSignal,
    );
  }
  async exec(
    data: Pick<WorkflowData, 'flow'> & { define?: ResolvedWorkflow },
    input: {
      input?: Record<string, (InputInvalidItem & { value: any })[]>;
      environmentParameters?: WorkflowRunnerEnvironmentParams;
    },
    options: { showError?: boolean },
    ob?: Observer<any, any>,
    abortSignal?: AbortSignal,
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
      return await this.runParse(define!, input, ob, abortSignal);
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
      input: Record<string, (InputInvalidItem & { value: any })[]>;
      template: ChatMessageListInputType;
      environmentParameters?: WorkflowRunnerEnvironmentParams;
    },
    fn: (item: WorkflowStreamData) => any,
    abort?: AbortSignal,
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
        input: input.input,
        environmentParameters: input.environmentParameters,
      },
      { showError: true },
      subject,
      abort,
    );

    return result2;
  }
}
