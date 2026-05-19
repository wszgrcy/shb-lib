import { CHAT_NODE_DEFINE } from '../../chat/chat.node.define';
import { LlmRunner } from '../../chat/main/llm.runner';

export const IterationMainConfig = {
  runner: LlmRunner,
  configDefine: CHAT_NODE_DEFINE,
} as const;
