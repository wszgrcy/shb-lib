import { NODE_COMMON } from '../common';
import { TEXT_NODE_DEFINE } from '../text.node.define';
import { TextareaRunner } from './textarea.runner';

export const TextMainConfig = {
  ...NODE_COMMON,
  runner: TextareaRunner,
  configDefine: TEXT_NODE_DEFINE,
} as const;
