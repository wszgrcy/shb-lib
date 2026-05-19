import { WebviewNodeConfig } from '../../../../share/type';
import { CHAT_NODE_DEFINE } from '../node.define';
import { NODE_COMMON } from '../common';
import { getSystemTemplate } from '../util';

export const ChatWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  configDefine: CHAT_NODE_DEFINE,
  initData: () => ({
    data: {
      transform: {
        resizable: true,
      },
      value: [getSystemTemplate()],
    },
    width: 300,
  }),
};
