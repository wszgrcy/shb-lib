import { ChatMessageListOutputType } from '../message.define';

export interface HistoryItem {
  messages: ChatMessageListOutputType;
  config: any;
  options: any;
  date: number;
}
