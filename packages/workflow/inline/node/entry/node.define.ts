import * as v from 'valibot';

import { actions, setComponent, valueChange } from '@piying/view-angular-core';

export const ENTRY_NODE_DEFINE = v.pipe(
  v.object({
    /** 入口点通过不同的选择,提供不同的数据 */
    type: v.pipe(
      v.string(),
      setComponent('select'),
      actions.inputs.patchAsync({
        options: (field) => field.context['getEntryType'](),
      }),
      valueChange((fn) => {
        fn().subscribe(({ list: [value], field }) => {
          field.context['getEntryOutputs'](value).then((list: any[]) => {
            field.context.setOutputHandle(1, list);
          });
        });
      }),
    ),
  }),
  actions.wrappers.patch(['div']),
  actions.class.top('grid auto-rows-auto gap-2'),
);
