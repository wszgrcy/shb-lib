import { OpenAI } from 'openai';
import { OpenAIChat } from './openai';

export class SparkChat extends OpenAIChat {
  override init(): void {
    this.instance = new OpenAI({
      baseURL: `https://spark-api-open.xf-yun.com/v1/chat/completions`,
      apiKey: ' ',
    });
    this.extraHeaders = {
      Authorization: `Bearer ${this.options.apiKey}`,
    };
  }
}
