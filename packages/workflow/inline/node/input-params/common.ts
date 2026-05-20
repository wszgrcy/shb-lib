import { NodeComponentType } from '../../../share';

export const NODE_COMMON: NodeComponentType = {
  priority: -999,
  type: 'input-params',
  label: `外界输入`,
  icon: { fontIcon: 'input' },
  disableHead: false,
  disableConnect: true,
  disableContext: true,
  color: 'primary',
};
