import { computed, inject, Injector } from 'static-injector';
import {
  AbortSignalToken,
  ChatServiceToken,
  CurrentCallNodeToken,
  CurrentContextToken,
  CurrentNodeToken,
  InputParamsToken,
  ModelOptionsToken,
} from '../token';
export type RunnerResult = Promise<
  (output: string) => Promise<{ extra?: any; value: any }>
>;
export type OutputResult = ReturnType<Awaited<RunnerResult>>;
import * as v from 'valibot';
import { WorkflowEmitter } from '../share';

import { isEmptyInput, isStringArray } from '@cyia/util';
import { ChatMetadata } from '../share/type';
import { ChatModelOptions } from '@shenghuabi/openai';
import { omitBy } from 'es-toolkit';
import { defaultsDeep } from 'es-toolkit/compat';
import { ModelInputConfig } from '../share/common';
export class NodeRunnerBase {
  protected node = inject(CurrentNodeToken);
  protected callNode = inject(CurrentCallNodeToken);
  protected context = inject(CurrentContextToken);
  // protected useInput = inject(UseInputToken);
  protected inputParams = inject(InputParamsToken);
  protected injector = inject(Injector);
  protected emitter = inject(WorkflowEmitter);
  protected abortSignal = inject(AbortSignalToken);
  async run(): RunnerResult {
    throw new Error('待实现');
  }

  inputs$$ = computed(() => {
    const obj = {} as Record<string, { value: any; extra?: any }>;
    for (const input of this.node.inputs) {
      if (!input.type) {
        const data = this.inputParams.get(input.value);
        if (!data) {
          if (input.optional) {
            continue;
          } else {
            throw new Error(`缺少输入参数: ${input.value}`);
          }
        }
        obj[input.value] = data;
      }
    }
    return obj;
  });
  inputValueObject$$ = computed(() =>
    Object.entries(this.inputs$$()).reduce(
      (obj, item) => {
        obj[item[0]] = item[1].value;
        return obj;
      },
      {} as Record<string, any>,
    ),
  );
  inputMetadataList$$ = computed(() =>
    Object.values(this.inputs$$()).map((item) => item.extra?.metadata),
  );
  getInputMetadata(input: string) {
    return this.inputs$$()[input].extra?.metadata;
  }
  async getInputChat() {
    const metadataList: ChatMetadata[] = [];
    const obj = {} as Record<string, any>;
    const errorList: string[] = [];
    for (const input of this.node.inputs) {
      if (!input.type) {
        const data = this.inputParams.get(input.value)!;
        if (!data) {
          if (input.optional) {
            continue;
          } else {
            errorList.push(input.value);
            continue;
          }
        }

        if (input.inputType === 'image') {
          obj[input.value] = data?.value;
        } else if (isStringArray(data?.value)) {
          obj[input.value] = data.value.join('\n');
        } else {
          obj[input.value] = data?.value ?? '';
        }

        const extra = data?.extra;
        if (extra) {
          if (Array.isArray(extra)) {
            for (const { metadata } of extra) {
              if (!metadata) {
                continue;
              }
              metadataList.push(metadata);
            }
          } else {
            if (extra.metadata) {
              metadataList.push(extra.metadata);
            }
          }
        }
      }
    }
    if (errorList.length) {
      throw new Error(`缺少输入参数: ${errorList.join(',')}`);
    }
    return { metadataList, obj };
  }
  #modelConfig = inject(ModelOptionsToken);
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
      : this.#modelConfig;
  }

  getParsedNode<T extends v.BaseSchema<any, any, any>>(schema: T) {
    const result = v.safeParse(schema, this.node.data.config);
    if (result.success) {
      return result.output;
    }
    if (typeof PROD_ENV === 'undefined' || !PROD_ENV) {
      console.log(result.issues);
    }
    throw new Error(JSON.stringify(result.issues));
  }
}
