import {
  NodeComponentType,
  RUNNER_ORIGIN_OUTPUT,
  RUNNER_REST_OUTPUT,
} from '../../../share';

export const NODE_COMMON: NodeComponentType = {
  priority: -999,
  type: 'input-params',
  label: `外界输入`,
  icon: { fontIcon: 'input' },
  disableHead: false,
  disableContext: true,
  color: 'primary',
  outputs: [[...RUNNER_ORIGIN_OUTPUT, ...RUNNER_REST_OUTPUT]],
};
