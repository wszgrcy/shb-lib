import {
  AssistantChatMessageType,
  SystemChatMessageType,
  UserChatMessageType,
} from '../message.define';

export function createSystemMessage() {
  return { role: 'system' } as SystemChatMessageType;
}
export function createUserMessage(text?: string) {
  return {
    role: 'user',
    content:
      typeof text === 'string' ? [{ type: 'text', text: '' }] : undefined,
  } as UserChatMessageType;
}
export function createAssistantMessage(text: string = '') {
  return {
    role: 'assistant',
    content: [{ type: 'text', text }],
  } as AssistantChatMessageType;
}
