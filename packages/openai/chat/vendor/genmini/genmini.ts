import { OpenAIChat } from '../openai';
import { GoogleGenerativeAI, StartChatParams } from '@google/generative-ai';
import {
  GenminiChatMessageListDefine,
  GenminiSystemMessageDefine,
} from './message.define';
import * as v from 'valibot';
import { ChatBodyInput, ChatRequestOptions } from '../../type';

export class GeminiChat extends OpenAIChat {
  #ggai!: GoogleGenerativeAI;
  override init(): void {
    this.#ggai = new GoogleGenerativeAI(this.options.apiKey!);
  }
  override async *stream(
    input: ChatBodyInput,
    options?: ChatRequestOptions,
  ): AsyncGenerator<string, void, unknown> {
    const model = this.#ggai.getGenerativeModel({
      model: this.options.model,
      generationConfig: {
        topP: this.options.top_p,
        temperature: this.options.temperature,
        maxOutputTokens: this.options.max_tokens,
      },
    });
    const messages = input.messages;
    const data = {} as Partial<StartChatParams>;
    if (messages[0].role === 'system') {
      const system = messages.shift();
      data.systemInstruction = v.parse(GenminiSystemMessageDefine, system);
    }
    data.history = v.parse(GenminiChatMessageListDefine, messages);
    const lastMessage = data.history.pop()!;

    const chat = model.startChat(data);
    const result = await chat.sendMessageStream(lastMessage.parts, {
      signal: options?.signal,
    });
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      yield chunkText;
    }
  }
}
