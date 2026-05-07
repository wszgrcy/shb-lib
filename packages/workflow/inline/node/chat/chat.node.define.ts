import * as v from 'valibot';

import {
  componentClass,
  condition,
  patchInputs,
  setComponent,
  valueChange,
} from '@piying/view-angular-core';
import { ChatMessageListInputType } from '@shenghuabi/openai';
import { EXAMPLES_DEFINE, llmModelConfig } from '../../../share/common';
export const ResponseList = ['json', 'markdown', 'yaml'] as const;
export const ResponseFormat = ['text', 'json_object', 'json_schema'] as const;
export type ResponseType = (typeof ResponseList)[number];
export const CHAT_NODE_DEFINE = v.looseObject({
  data: v.looseObject({
    config: v.pipe(
      v.object({
        llm: v.optional(llmModelConfig()),
        /** 处理时解析 */
        responseFormat: v.pipe(
          v.optional(v.picklist(ResponseFormat)),
          patchInputs({
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
          patchInputs({
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
      }),

      componentClass('grid auto-rows-auto gap-2'),
    ),
    value: v.pipe(
      v.custom<ChatMessageListInputType>(Boolean),
      setComponent(''),
      condition({
        environments: ['display'],
        actions: [
          setComponent('prompt-list'),
          valueChange((fn) => {
            fn({ list: [undefined] }).subscribe(({ list: [value], field }) => {
              if (!Array.isArray(value)) {
                return;
              }
              const inputValue: ChatMessageListInputType = value ?? [];
              field.context
                .parseTemplate(
                  inputValue.flatMap((item) =>
                    item.content.map((item) =>
                      item.type === 'text' ? item.text : '',
                    ),
                  ),
                )
                .then((value: any) => {
                  if (!value) {
                    return;
                  }
                  field.context.changeHandleData(field, 'input', 1, value);
                });

              const list = inputValue
                .flatMap((item) =>
                  item.content.map((item) =>
                    item.type === 'image_url' ? item.image_url.url : undefined,
                  ),
                )
                .filter(Boolean)
                .map((item) => ({
                  value: `${item}`,
                  label: `${item}`,
                  inputType: `image` as const,
                }));
              field.context.changeHandleData(field, 'input', 3, list ?? []);
            });
          }),
        ],
      }),
    ),
  }),
});
