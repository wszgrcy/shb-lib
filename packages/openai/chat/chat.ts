import {
  AssistantMessage,
  Context,
  stream,
  StreamOptions,
  UserMessage,
} from '@earendil-works/pi-ai';
import {
  getModelConfig,
  ModelConfigInputType,
} from './util/get-custom-provider';
import type OpenAI from 'openai';
import {
  AssistantChatMessage,
  ChatMessageItemType,
  SystemChatMessageType,
  UserChatMessage,
} from './message.define';
import { deepClone } from '@cyia/util';
import { Injector } from 'static-injector';
import { OpenAIConfigToken } from './token';
import * as v from 'valibot';

export function createChatStream(input: ModelConfigInputType) {
  const result = getModelConfig(input);
  return (
    context: Omit<Context, 'messages'> & { messages: ChatMessageItemType[] },
    options?: StreamOptions,
    extra?: {
      response_format?: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming['response_format'];
      injector?: Injector;
    },
  ) => {
    context.messages = deepClone(context.messages);
    const PiPUserConvertDefine = v.pipe(
      UserChatMessage,
      v.transform(
        (item) =>
          ({
            role: 'user',
            timestamp: Date.now(),
            content: item.content.map((item) => {
              if (item.type === 'text') {
                return item;
              } else {
                const match = item.image_url.url.match(
                  /^data:([^;]+);base64,(.+)$/,
                );
                return {
                  type: 'image',
                  mimeType: match![1],
                  data: match![2],
                };
              }
            }),
          }) satisfies UserMessage,
      ),
    );
    const PiPAssConvertDefine = v.pipe(
      AssistantChatMessage,
      v.transform(
        (item) =>
          ({
            role: 'assistant',
            timestamp: Date.now(),
            content: item.content.map((item) => item),
            api: result.model.api,
            provider: result.model.provider,
            usage: {
              cacheRead: 0,
              cacheWrite: 0,
              cost: {
                input: 0,
                output: 0,
                cacheRead: 0,
                cacheWrite: 0,
                total: 0,
              },
              input: 0,
              output: 0,
              totalTokens: 0,
            },
            stopReason: 'stop',
            model: result.model.api,
          }) satisfies AssistantMessage,
      ),
    );
    // todo 系统类型在输入时未处理
    const sysIndex = context.messages.findIndex(
      (item) => item.role === 'system',
    );
    if (sysIndex !== -1) {
      const item = context.messages[sysIndex] as any as SystemChatMessageType;
      context.messages.splice(sysIndex, 1);
      context.systemPrompt = item.content[0].text;
    }
    const createStream = () =>
      stream(
        result.model,
        {
          ...context,
          messages: v.parse(
            v.array(v.union([PiPUserConvertDefine, PiPAssConvertDefine])),
            context.messages,
          ),
        },
        {
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
        },
      );

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
