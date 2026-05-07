import { OpenAIChat } from '../openai';
import Anthropic from '@anthropic-ai/sdk';
import {
  AnthropicChatMessageListDefine,
  AnthropicSystemMessageDefine,
} from './message.define';
import { createAsyncGeneratorAdapter } from '@cyia/util';
import * as v from 'valibot';
import {
  ChatBodyInput,
  ChatRequestOptions,
  ChatToolBodyInput,
} from '../../type';
export class AnthropicChat extends OpenAIChat {
  client!: Anthropic;
  override init(): void {
    this.client = new Anthropic({ apiKey: this.options.apiKey });
  }
  override async *stream(
    input: ChatBodyInput,
    options?: ChatRequestOptions,
  ): AsyncGenerator<string, void, unknown> {
    const body = {
      model: this.options.model,
      max_tokens: this.options.max_tokens,
      top_p: this.options.top_p,
      temperature: this.options.temperature,
      stream: true,
    } as Partial<Anthropic.Messages.MessageStreamParams>;

    if (input.messages[0].role === 'system') {
      const system = input.messages.shift()!.content;
      body.system = v.parse(AnthropicSystemMessageDefine, system);
    }
    body.messages = v.parse(AnthropicChatMessageListDefine, input.messages);
    const result = this.client.messages.stream(body as any, {
      signal: options?.signal,
    });
    const aga = createAsyncGeneratorAdapter<string>();
    result.once('end', () => aga.complete());
    result.on('text', (text) => {
      aga.next(text);
    });
    for await (const item of aga.getData()) {
      yield item;
    }
  }
  override async callTool(
    input: ChatToolBodyInput,
    options?: ChatRequestOptions,
  ) {
    const body =
      {} as Partial<Anthropic.Messages.MessageCreateParamsNonStreaming> &
        Pick<Anthropic.Messages.MessageCreateParamsNonStreaming, 'messages'>;

    if (input.messages[0].role === 'system') {
      const system = input.messages.shift()!.content;
      body.system = v.parse(AnthropicSystemMessageDefine, system);
    }
    body.messages = v.parse(AnthropicChatMessageListDefine, input.messages);
    const result = await this.client.messages.create(
      {
        ...body,
        model: this.options.model,
        max_tokens: this.options.max_tokens,
        top_p: this.options.top_p,
        temperature: this.options.temperature,
        stream: false,
        tools: input.tools.map((item) => ({
          name: item.function.name,
          description: item.function.description,
          input_schema: item.function.parameters! as any,
        })),
      },
      {
        signal: options?.signal,
      },
    );
    const isToolResult = result.content.find(
      (item) => item.type === 'tool_use',
    );
    if (isToolResult) {
      return {
        type: 'function' as const,
        function: {
          name: isToolResult.name,
          arguments: isToolResult.input as Record<string, any> | undefined,
        },
      };
    }
    const text = result.content.find((item) => item.type === 'text');
    return {
      type: 'text' as const,
      text: text!.text,
    };
  }
}
