import { RUNNER_ORIGIN_OUTPUT } from '../../../share';

import { NodeComponentType } from '../../../share';

export const NODE_COMMON: NodeComponentType = {
  priority: -100,
  type: 'input-params',
  label: `入口`,
  icon: { fontIcon: 'chat' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: [`- 入口`].join('\n'),
  outputs: [RUNNER_ORIGIN_OUTPUT],
};
