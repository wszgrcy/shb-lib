import { NODE_COMMON } from '../common';
import { ENTRY_NODE_DEFINE } from '../node.define';
import { InputParamsRunner } from './runner';

export const EntryMainConfig = {
  ...NODE_COMMON,
  runner: InputParamsRunner,
  configDefine: ENTRY_NODE_DEFINE,
} as const;
