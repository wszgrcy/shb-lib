import * as v from 'valibot';

import { actions, setComponent, valueChange } from '@piying/view-angular-core';
import { filter } from 'rxjs';

export const InputParams_NODE_DEFINE = v.pipe(
  v.object({
    /** 入口点通过不同的选择,提供不同的数据 */
    type: v.pipe(
      v.string(),
      setComponent('select'),
      actions.inputs.patchAsync({
        options: (field) => field.context['getEntryType'](),
      }),
      valueChange((fn) => {
        fn()
          .pipe(filter(Boolean))
          .subscribe(({ list: [value], field }) => {
            field.context['getEntryOutputs'](value).then((list: any[]) => {
              field.context.setOutputHandle(1, list);
            });
          });
      }),
      v.title('输入类型'),
    ),

    editorInput: v.pipe(v.optional(v.boolean(), false), v.title('编辑器输入')),
  }),
  actions.wrappers.patch(['div']),
  actions.class.top('grid auto-rows-auto gap-2'),
);
