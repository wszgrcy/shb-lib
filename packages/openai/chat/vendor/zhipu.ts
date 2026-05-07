import { OpenAI } from 'openai';
import { OpenAIChat } from './openai';

export class ZhipuChat extends OpenAIChat {
  override init(): void {
    this.instance = new OpenAI({
      baseURL: `https://open.bigmodel.cn/api/paas/v4`,
      apiKey: ' ',
    });
    this.extraHeaders = {
      Authorization: `Bearer ${this.options.apiKey}`,
    };
  }
}
