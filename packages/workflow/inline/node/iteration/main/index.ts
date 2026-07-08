import { NODE_COMMON } from '../common';
import { ITERATION_NODE_DEFINE } from '../node.define';
import { IterationRunner } from './runner';

export const IterationMainConfig = {
  ...NODE_COMMON,
  runner: IterationRunner,
  configDefine: ITERATION_NODE_DEFINE,
} as const;
