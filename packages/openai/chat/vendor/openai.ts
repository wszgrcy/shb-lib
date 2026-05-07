import { OpenAI } from 'openai';
import { ChatMessageListDefine } from '../message.define';
import { ChatBodyInput, ChatRequestOptions, ChatToolBodyInput } from '../type';
import * as v from 'valibot';
import type { Stream } from 'openai/streaming.mjs';
import { ChatCompletionCreateParamsStreaming } from 'openai/resources/index.mjs';
import { ChatModelOptions } from '../options.define';
export class OpenAIChat {
  protected instance!: OpenAI;
  protected extraBody = {};
  protected extraHeaders = {};
  constructor(protected options: ChatModelOptions) {}
  init() {
    this.instance = new OpenAI({
      apiKey: this.options.apiKey || ' ',
      baseURL: this.options.baseURL ?? undefined,
    });
  }
  async #createStream(
    input: ChatCompletionCreateParamsStreaming,
    options?: ChatRequestOptions,
  ): Promise<
    Stream<OpenAI.Chat.Completions.ChatCompletionChunk> & {
      _request_id?: string | null;
    }
  > {
    return await this.instance.chat.completions
      .create(input, { headers: this.extraHeaders, ...options })
      .catch(async (error) => {
        // ollama server/routes.go
        if (options?.tryPull?.(error)) {
          await options?.pullModel!(this.options.model);
          return this.#createStream(input, {
            ...options,
            tryPull: () => false,
          });
        }

        throw error;
      });
  }
  async *stream(input: ChatBodyInput, options?: ChatRequestOptions) {
    const input2 = {
      ...input,
      messages: v.parse(ChatMessageListDefine, input.messages),
      model: this.options.model,
      stream: true,
      max_tokens: this.options.max_tokens,
      top_p: this.options.top_p,
      temperature: this.options.temperature,
      frequency_penalty: this.options.frequency_penalty,
      presence_penalty: this.options.presence_penalty,
      seed: this.options.seed,
      stop: this.options.stop,
      ...this.extraBody,
    } as ChatCompletionCreateParamsStreaming;
    const result = await this.#createStream(input2, options);
    let isThinking = 0;
    for await (const item of result) {
      try {
        //reasoning_content 思考
        if (!item.choices[0].finish_reason) {
          if (
            typeof (item.choices[0].delta as any).reasoning_content ===
              'string' ||
            typeof (item.choices[0].delta as any).reasoning === 'string'
          ) {
            if (isThinking === 0) {
              isThinking = 1;
              yield '<thinking>';
            }
            const result =
              (item.choices[0].delta as any).reasoning_content ??
              (item.choices[0].delta as any).reasoning;
            if (result) {
              yield result;
            }
          } else if (typeof item.choices[0].delta.content === 'string') {
            if (isThinking === 1) {
              yield '</thinking>';
              isThinking = 2;
            }
            const result = item.choices[0].delta.content!;
            if (result) {
              yield result;
            }
          }
        }
      } catch (error) {
        throw error;
      }
    }
  }
  // 工具调用,暂时不清楚怎么调用...是返回工具,还是返回对话
  async callTool(input: ChatToolBodyInput, options?: ChatRequestOptions) {
    const result = await this.instance.chat.completions.create(
      {
        ...input,
        messages: v.parse(ChatMessageListDefine, input.messages),
        model: this.options.model,
        max_tokens: this.options.max_tokens,
        top_p: this.options.top_p,
        temperature: this.options.temperature,
        frequency_penalty: this.options.frequency_penalty,
        presence_penalty: this.options.presence_penalty,
        seed: this.options.seed,
        stop: this.options.stop,
        ...this.extraBody,
        stream: false,
      },
      { headers: this.extraHeaders, ...options },
    );
    const isTool = !!result.choices[0].message.tool_calls;
    if (isTool) {
      // todo
      const data = (result.choices[0].message.tool_calls![0] as any).function;
      return {
        type: 'function' as const,
        function: {
          name: data.name,
          arguments: JSON.parse(data.arguments) as
            | Record<string, any>
            | undefined,
        },
      };
    }
    return { type: 'text' as const, text: result.choices[0].message.content! };
  }
}
