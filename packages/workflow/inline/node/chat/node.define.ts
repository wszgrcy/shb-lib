import * as v from 'valibot';

import { actions, setComponent, valueChange } from '@piying/view-angular-core';
import { ChatMessageListInputType } from '@shenghuabi/openai';
import { EXAMPLES_DEFINE, llmModelConfig } from '../../../share/common';
import { isChatSchema } from '@cyia/util';
export const ResponseList = ['json', 'markdown', 'yaml'] as const;
export const ResponseFormat = ['text', 'json_object', 'json_schema'] as const;
export type ResponseType = (typeof ResponseList)[number];
export const CHAT_NODE_DEFINE = v.pipe(
  v.object({
    llm: v.optional(llmModelConfig()),
    /** 处理时解析 */
    responseFormat: v.pipe(
      v.optional(v.picklist(ResponseFormat)),
      actions.inputs.patch({
        options: [
          // 有输入json时
          {
            label: '自动',
            value: undefined,
            description: `传入JsonSchema时为[json_schema],否则为[text]`,
          },
          { label: '文本', value: 'text' },
          {
            label: 'JSON对象',
            value: 'json_object',
            description: '只限制返回类型为JSON对象,不对字段进行限制',
          },
          {
            label: 'JSON格式定义',
            value: 'json_schema',
            description:
              '限制返回类型为JSON对象,同时限制字段,不建议手动指定,传入JsonSchema后自动启用',
          },
        ],
      }),
      v.title('响应格式'),
    ),
    /** 处理后解析 */
    parseBy: v.pipe(
      v.optional(v.picklist(ResponseList)),
      actions.inputs.patch({
        options: [
          { label: '直接返回', value: undefined },
          {
            label: 'json',
            value: 'json',
            description: `将返回的json代码块内容或原始内容解析为对象`,
          },
          {
            label: 'markdown',
            value: 'markdown',
            description: `[需要提示词约束]将返回其中的markdown代码块内容或原始内容`,
          },
          {
            label: 'yaml',
            value: 'yaml',
            description: `[需要提示词约束]将返回的yaml代码块内容或原始内容解析为对象`,
          },
        ],
      }),
      v.title('返回解析'),
      valueChange((fn) => {
        fn({ list: [['..', 'responseFormat']] }).subscribe(
          ({ list: [value], field }) => {
            if ((value ?? '').startsWith('json')) {
              if (!field.form.control!.value) {
                field.form.control!.updateValue('json');
              }
            }
          },
        );
      }),
    ),
    examples: EXAMPLES_DEFINE,
    value: v.pipe(
      v.custom<ChatMessageListInputType>(Boolean),
      setComponent('prompt-list'),
    ),
    jsonSchema: v.pipe(
      v.optional(
        v.pipe(
          v.any(),
          v.check(
            (value) => isChatSchema(value),
            (issue) =>
              `jsonSchema 格式异常:输入 ${issue.input};需要类型 {name:string,schema:object}`,
          ),
        ),
      ),
      setComponent('div'),
      actions.wrappers.patch(['use-ref']),
      v.title('JsonSchema')
    ),
  }),
  actions.wrappers.patch(['div']),
  actions.class.top('grid auto-rows-auto gap-2'),
);
