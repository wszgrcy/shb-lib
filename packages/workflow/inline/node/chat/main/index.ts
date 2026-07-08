import { NODE_COMMON } from '../common';
import { CHAT_NODE_DEFINE } from '../node.define';
import { LlmRunner } from './runner';

export const ChatMainConfig = {
  ...NODE_COMMON,
  runner: LlmRunner,
  configDefine: CHAT_NODE_DEFINE,
} as const;
