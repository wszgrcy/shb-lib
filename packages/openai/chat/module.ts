import { ChatHistoryService } from './chat.history.service';
import { ChatProviderService } from './service';
import { OpenAIConfigToken } from './token';

export const OPENAI_MODULE = {
  provider: [ChatProviderService, ChatHistoryService],
  token: { OpenAIConfigToken },
};
