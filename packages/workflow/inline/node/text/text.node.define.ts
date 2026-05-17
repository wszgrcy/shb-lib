import {
  actions,
  setComponent,
} from '@piying/view-angular-core';
import * as v from 'valibot';
export const TEXT_NODE_DEFINE = v.looseObject({
  data: v.looseObject({
    value: v.pipe(
      v.string(),
      setComponent('textarea-template'),
      actions.class.top('nodrag'),
      // valueChange((fn) => {
      //   fn({ list: [undefined] }).subscribe(({ list: [value], field }) => {
      //     if (typeof value !== 'string') {
      //       return;
      //     }
      //     field.context.parseTemplate([value]).then((value: any) => {
      //       if (!value) {
      //         return;
      //       }
      //       field.context.changeHandleData(field, 'input', 1, value);
      //     });
      //   });
      // }),
    ),
  }),
});
