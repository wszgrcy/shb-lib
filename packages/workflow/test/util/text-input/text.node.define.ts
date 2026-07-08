import { actions } from '@piying/view-angular-core';
import * as v from 'valibot';
export const TEXT_NODE_DEFINE = v.object({
  value: v.pipe(v.string(), actions.class.top('nodrag')),
});
