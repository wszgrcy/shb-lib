import { Context, stream, StreamOptions } from '@earendil-works/pi-ai';
import {
  getModelConfig,
  ModelConfigInputType,
} from './util/get-custom-provider';
import type OpenAI from 'openai';
import { SystemChatMessageType } from './message.define';
import { deepClone } from '@cyia/util';

export function createChat(input: ModelConfigInputType) {
  const result = getModelConfig(input);
  return (
    context: Context,
    options?: StreamOptions,
    extra?: {
      response_format?: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming['response_format'];
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
    return stream(result.model, context, {
      ...options,
      apiKey: options?.apiKey ?? result.config.apiKey,
      onPayload(payload, model) {
        payload = options?.onPayload?.(payload, model) ?? payload;
        // todo 这里只对openai厂商适配了json参数
        if (model.api === 'openai-completions') {
          return {
            ...(payload as any),
            response_format: extra?.response_format,
          };
        }
        return payload;
      },
    });
  };
}
