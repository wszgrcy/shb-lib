import { WebviewNodeConfig } from '../../../../share/type';
import { NODE_COMMON } from '../common';
import { InputParams_NODE_DEFINE } from '../node.define';

export const InputParamsWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: InputParams_NODE_DEFINE,
};
