import { NODE_COMMON } from '../common';
import { CHAT_NODE_DEFINE } from '../chat.node.define';
import { LlmRunner } from './llm.runner';

export const ChatMainConfig = {
  ...NODE_COMMON,
  runner: LlmRunner,
  define: CHAT_NODE_DEFINE,
} as const;
