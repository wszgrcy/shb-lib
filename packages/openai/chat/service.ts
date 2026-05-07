import { inject } from 'static-injector';
import { OpenAIChat } from './vendor/openai';
import { ChatRequestOptions, ChatToolBodyInput } from './type';
import { createCompatibleFactory } from './vendor/openai-compatible.factory';
import { GeminiChat } from './vendor/genmini/genmini';
import { AnthropicChat } from './vendor/anthropic/anthropic';
import { createAssistantMessage } from './util/create';
import { ThinkList } from './const';
import {
  CreateChatModelOptions,
  InputChatOptionsDefine,
} from './options.define';
import { OpenAIConfigToken } from './token';
import { ChatHistoryService } from './chat.history.service';
import * as v from 'valibot';
export class ChatProviderService {
  #config = inject(OpenAIConfigToken);
  #chatHistory = inject(ChatHistoryService);

  create(input: Omit<CreateChatModelOptions, 'name'>) {
    let options = v.parse(InputChatOptionsDefine, input);
    let instance;
    const extraOptions =
      options.vendorOptions?.[options.vendor]?.['extraOptions'];
    options = {
      ...extraOptions,
      ...options,
      apiKey: options.apiKey?.trim() || extraOptions?.apiKey || ' ',
    };
    if (!options.vendor || options.vendor === 'openai') {
      instance = new OpenAIChat(options);
    } else if (options.vendor === 'gemini') {
      instance = new GeminiChat(options);
    } else if (options.vendor === 'claude') {
      instance = new AnthropicChat(options);
    } else {
      instance = createCompatibleFactory(options);
    }
    instance.init();
    const openAIOptions = this.#config;
    const chatHistory = this.#chatHistory;

    const fn = async function* (...args: Parameters<OpenAIChat['stream']>) {
      const result = instance.stream(args[0], {
        ...args[1],
        tryPull: openAIOptions().tryPull,
        pullModel: openAIOptions().pullModel,
      });
      let content = '';
      let isThink = false;
      let thinkStart = 0;
      let thinkEnd: number | undefined;
      let start = true;
      /** 是否处于思考期 */
      let isThinking = false;
      let contentEnd: number | undefined;
      let lastEmit;
      for await (const delta of result) {
        content += delta;
        if (start) {
          start = false;
          const result = ThinkList.find((item) =>
            delta.startsWith(`<${item}>`),
          );
          if (result) {
            isThink = true;
            thinkStart = result.length + 2;
            isThinking = true;
          }
        } else if (isThink && thinkEnd === undefined) {
          const result = ThinkList.find((item) => delta === `</${item}>`);
          if (result) {
            contentEnd = content.length;
            thinkEnd = content.length - result.length - 3;
            isThinking = false;
          }
        }
        lastEmit = {
          content: isThink
            ? (contentEnd ? content.slice(contentEnd) : '').trim()
            : content,
          isThinking: isThinking,
          delta,
          thinkContent: isThink
            ? content.slice(thinkStart, thinkEnd).trim()
            : undefined,
        };
        yield lastEmit;
      }
      const lastMessage = createAssistantMessage(
        isThink ? (contentEnd ? content.slice(contentEnd) : '') : content,
      );
      if (lastEmit?.thinkContent) {
        lastMessage.thinkContent = lastEmit.thinkContent;
      }
      chatHistory.save(
        [...args[0].messages, lastMessage],
        { ...args[0], messages: undefined },
        options,
      );
    };
    return {
      stream: fn,
      chat: async (...args: Parameters<OpenAIChat['stream']>) => {
        const result = fn(...args);
        let obj;
        for await (const element of result) {
          obj = element;
        }
        return obj!;
      },
      callTool: (input: ChatToolBodyInput, options?: ChatRequestOptions) =>
        instance.callTool(input, options),
    };
  }
}
