import { RUNNER_ORIGIN_OUTPUT } from '../../../share';

import { NodeComponentType } from '../../../share';

export const NODE_COMMON: NodeComponentType = {
  priority: -100,
  type: 'iteration',
  label: `迭代`,
  icon: { fontIcon: 'chat' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: [`- 列表循环`].join('\n'),
  // 普通的和flat
  outputs: [RUNNER_ORIGIN_OUTPUT],
};
