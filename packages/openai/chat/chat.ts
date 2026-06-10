import { Context, stream, StreamOptions } from '@earendil-works/pi-ai';
import {
  getModelConfig,
  ModelConfigInputType,
} from './util/get-custom-provider';
import type OpenAI from 'openai';
import { SystemChatMessageType } from './message.define';
import { deepClone } from '@cyia/util';
import { Injector } from 'static-injector';
import { OpenAIConfigToken } from './token';

export function createChatStream(input: ModelConfigInputType) {
  const result = getModelConfig(input);
  return (
    context: Context,
    options?: StreamOptions,
    extra?: {
      response_format?: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming['response_format'];
      injector?: Injector;
    },
  ) => {
    context.messages = deepClone(context.messages);
    // todo 系统类型在输入时未处理
    const sysIndex = context.messages.findIndex(
      (item) => item.role === ('system' as any),
    );
    if (sysIndex !== -1) {
      const item = context.messages[sysIndex] as any as SystemChatMessageType;
      context.messages.splice(sysIndex, 1);
      context.systemPrompt = item.content[0].text;
    }
    const createStream = () =>
      stream(result.model, context, {
        ...options,
        apiKey: options?.apiKey ?? result.config.apiKey,
        onPayload(payload, model) {
          payload = options?.onPayload?.(payload, model) ?? payload;
          if (model.api === 'openai-completions') {
            return {
              ...(payload as any),
              response_format: extra?.response_format,
            };
          }
          return payload;
        },
      });

    let currentStream = createStream();
    const config = extra?.injector?.get(OpenAIConfigToken);
    return (async function* () {
      let hasRetry = false;
      while (true) {
        let retry = false;
        for await (const item of currentStream) {
          if (item.type === 'error') {
            if (
              item.error.errorMessage?.includes('404') &&
              item.error.errorMessage?.includes(
                'no router for requested model',
              ) &&
              !hasRetry
            ) {
              if (config?.().tryPull?.()) {
                await config().pullModel?.(input.model);
                retry = true;
                break;
              }
            }
          }
          yield item;
        }
        if (!retry || hasRetry) {
          break;
        }
        hasRetry = true;
        currentStream = createStream();
      }
    })();
  };
}
