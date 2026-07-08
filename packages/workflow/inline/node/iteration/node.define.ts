import * as v from 'valibot';

import { actions, asControl } from '@piying/view-angular-core';
export const ResponseList = ['json', 'markdown', 'yaml'] as const;
export const ResponseFormat = ['text', 'json_object', 'json_schema'] as const;
export type ResponseType = (typeof ResponseList)[number];
export const ITERATION_NODE_DEFINE = v.pipe(
  v.object({
    list: v.pipe(
      v.array(v.any()),
      asControl(),
      actions.wrappers.patch(['use-ref']),
    ),
  }),
  actions.wrappers.patch(['div']),
  actions.class.top('grid auto-rows-auto gap-2'),
);
