import { inject, Injector } from 'static-injector';
import {
  AbortSignalToken,
  ChatServiceToken,
  CurrentCallNodeToken,
  CurrentContextToken,
  CurrentNodeToken,
  ModelOptionsToken,
  NodeContextToken,
  NodeInputsToken,
} from '../token';
export type RunnerResult = Promise<(output: string) => Promise<any>>;
export type OutputResult = ReturnType<Awaited<RunnerResult>>;
import * as v from 'valibot';
import { WorkflowEmitter } from '../share';

import { isEmptyInput } from '@cyia/util';
import { ChatModelOptions } from '@shenghuabi/openai';
import { omitBy } from 'es-toolkit';
import { defaultsDeep } from 'es-toolkit/compat';
import { ModelInputConfig } from '../share/common';
export class NodeRunnerBase<
  TSchema extends v.BaseSchema<any, any, any> | undefined = undefined,
> {
  protected node = inject(CurrentNodeToken);
  protected callNode =
    inject(CurrentCallNodeToken, { optional: true }) ?? undefined;
  protected context = inject(CurrentContextToken);
  protected injector = inject(Injector);
  protected emitter = inject(WorkflowEmitter);
  protected abortSignal = inject(AbortSignalToken);
  protected inputs =
    inject<
      TSchema extends v.BaseSchema<any, any, any>
        ? v.InferOutput<TSchema>
        : undefined
    >(NodeInputsToken);
  async run(): RunnerResult {
    throw new Error('待实现');
  }

  #modelConfig = inject(ModelOptionsToken, { optional: true }) ?? undefined;
  getContext() {
    return this.injector.get(NodeContextToken);
  }
  mergeChatModel(input?: ModelInputConfig): Partial<ChatModelOptions> {
    const chatService = this.injector.get(ChatServiceToken);
    let presetConfig = {};
    if (input?.name) {
      presetConfig = chatService.getModelConfig(input.name) ?? {};
    }
    return input
      ? defaultsDeep(
          omitBy(
            {
              model: input.model,
              baseURL: input?.baseURL,
            },
            isEmptyInput,
          ),
          omitBy(presetConfig, isEmptyInput),
          omitBy(this.#modelConfig ?? {}, isEmptyInput),
        )
      : (this.#modelConfig ?? {});
  }
}
