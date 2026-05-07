import { HelpObj } from '../../../share';
import { NodeComponentType } from '../../../share/type';

export const NODE_COMMON: NodeComponentType = {
  type: 'textarea',
  label: `文本模板`,
  icon: { fontIcon: 'text_snippet' },
  disableHead: false,
  disableConnect: false,
  color: 'primary',
  help: `${HelpObj.templateVarLine}`,
  priority: -98,
};
