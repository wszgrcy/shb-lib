import { NODE_COMMON } from '../common';
import { TEXT_NODE_DEFINE } from '../text.node.define';
import { TextInputRunner } from './runner';

export const TextInputTestConfig = {
  ...NODE_COMMON,
  runner: TextInputRunner,
  configDefine: TEXT_NODE_DEFINE,
} as const;
