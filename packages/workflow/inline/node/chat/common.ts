import { HelpObj } from '../../../share';
import {
  RUNNER_ORIGIN_OUTPUT_KEY,
} from '../../../share';
import { NodeComponentType } from '../../../share';

export const NODE_COMMON: NodeComponentType = {
  priority: -100,
  type: 'chat',
  label: `对话`,
  icon: { fontIcon: 'chat' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: [
    `- 点击输入框左侧图标可以切换或添加新行`,
    `${HelpObj.templateVarLine}`,
    '### 指定类型输出',
    '- `JsonSchema`为可选输入,需要使用`代码`节点生成',
    '> 设置后响应类型会自动变为json',
    '> 也可以使用任何符合`ChatJsonSchema`类型的数据结构传入(`代码`节点编辑时有声明)',
    '- 原始输出: 不进行任何格式化处理的输出',
    '### 定义图片变量',
    '- 只有支持图片传入的大语言模型才支持此选项',
    '> 如`minicpm-v:8b`',
    '- 定义后在对话中可以传入图片',
    '- 或者可以使用`图片输入`节点手动指定一张图片',
    '- 只有`用户提示词`可以使用图片输入',
    '> 不清楚是否所有模型都遵循此规则,所以并没有限制输入',
  ].join('\n'),
  // config: defineConfig,
  // inputs: [
  //   [],
  //   [
  //     {
  //       label: 'JsonSchema',
  //       value: DEFAULT_CHAT_SCHEMA_KEY,
  //       inputType: 'schema',
  //       optional: true,
  //     },
  //   ],
  // ],
  outputs: [[{ label: '原始输出', value: RUNNER_ORIGIN_OUTPUT_KEY }]],
};
