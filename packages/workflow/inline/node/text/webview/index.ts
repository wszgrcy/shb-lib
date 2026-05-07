import { WebviewNodeConfig } from '../../../../share/type';
import { NODE_COMMON } from '../common';
import { TEXT_NODE_DEFINE } from '../text.node.define';

export const TextWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  displayConfig: TEXT_NODE_DEFINE,
  initData: () => ({
    data: {
      transform: {
        resizable: true,
      },

      value: '',
    },
    width: 300,
  }),
};
