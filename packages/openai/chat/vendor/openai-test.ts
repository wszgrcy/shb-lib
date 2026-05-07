import { ChatModelOptions } from '../options.define';
import {
  ChatBodyInput,
  ChatRequestOptions,
  ChatToolBodyInput,
} from '../type';
export class OpenAITestChat {
  static ChatResult: (
    input: ChatBodyInput,
    options?: ChatRequestOptions,
  ) => string;

  constructor(protected options: ChatModelOptions) {}
  init() {}
  async *stream(input: ChatBodyInput, options?: ChatRequestOptions) {
    const result = OpenAITestChat.ChatResult(input, options);
    for (const str of result) {
      yield str;
    }
  }
  async callTool(input: ChatToolBodyInput, options?: ChatRequestOptions) {
    return {
      type: 'function' as const,
      function: {
        name: '',
        arguments: {},
      },
    };
  }
}
