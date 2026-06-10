import { computed, inject, Injector } from 'static-injector';
import {
  AbortSignalToken,
  CurrentCallNodeToken,
  CurrentContextToken,
  CurrentNodeToken,
  EnviromentParametersToken,
  ModelOptionsToken,
  NodeContextToken,
  NodeInputsToken,
} from '../token';
export type RunnerResult = Promise<(id: string) => Promise<any>>;
export type OutputResult = ReturnType<Awaited<RunnerResult>>;
import * as v from 'valibot';
import { WorkflowEmitter } from '../share';

import { isEmptyInput } from '@cyia/util';
import { omitBy } from 'es-toolkit';
import { defaultsDeep } from 'es-toolkit/compat';
import { ModelConfigInputType } from '@shenghuabi/openai';
export class NodeRunnerBase<
  TSchema extends v.BaseSchema<any, any, any> | undefined = undefined,
> {
  protected node = inject(CurrentNodeToken);
  protected callNode =
    inject(CurrentCallNodeToken, { optional: true }) ?? undefined;
  protected runnerContext = inject(CurrentContextToken);
  protected injector = inject(Injector);
  protected emitter = inject(WorkflowEmitter);
  protected abortSignal = inject(AbortSignalToken);
  protected inputs =
    inject<
      TSchema extends v.BaseSchema<any, any, any>
        ? v.InferOutput<TSchema>
        : undefined
    >(NodeInputsToken);
  protected environmentContextData = inject(EnviromentParametersToken)!;

  async run(): RunnerResult {
    throw new Error('待实现');
  }

  #modelConfig = inject(ModelOptionsToken, { optional: true }) ?? undefined;
  nodeContextData$$ = computed(() => this.injector.get(NodeContextToken)());

  mergeChatModel(input?: ModelConfigInputType): ModelConfigInputType {
    return defaultsDeep(
      // 直接输入的
      omitBy(input ?? {}, isEmptyInput),
      // 对话上下文
      omitBy(this.#modelConfig ?? {}, isEmptyInput),
    );
  }
}
