import { WebviewNodeConfig } from '../../../../share/type';
import { NODE_COMMON } from '../common';
import { ENTRY_NODE_DEFINE } from '../node.define';

export const EntryWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: ENTRY_NODE_DEFINE,
};
