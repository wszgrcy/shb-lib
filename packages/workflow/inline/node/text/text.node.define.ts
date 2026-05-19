import { actions, setComponent } from '@piying/view-angular-core';
import * as v from 'valibot';
export const TEXT_NODE_DEFINE = v.object({
  value: v.pipe(
    v.any(),
    setComponent('textarea-template'),
    actions.class.top('nodrag'),
  ),
});
