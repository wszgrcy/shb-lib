import { NODE_COMMON } from '../common';
import { InputParams_NODE_DEFINE } from '../node.define';
import { InputParamsRunner } from './runner';

export const EntryMainConfig = {
  ...NODE_COMMON,
  runner: InputParamsRunner,
  configDefine: InputParams_NODE_DEFINE,
} as const;
