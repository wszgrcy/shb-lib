import { WebviewNodeConfig } from '../../../../share/type';
import { NODE_COMMON } from '../common';
import {  ITERATION_NODE_DEFINE } from '../node.define';

export const IterationWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: ITERATION_NODE_DEFINE,
};
