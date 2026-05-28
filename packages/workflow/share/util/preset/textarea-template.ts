import { actions, asControl, setComponent } from '@piying/view-angular-core';
import * as v from 'valibot';
export const TextareaTemplateDefine = v.pipe(
  v.union([
    v.string(),
    v.array(
      v.array(
        v.union([
          v.object({ text: v.string(), type: v.literal('text') }),
          v.object({
            item: v.object({
              label: v.string(),
              value: v.array(v.union([v.string(), v.number()])),
              type: v.optional(v.picklist(['custom'])),
              suffix: v.optional(v.string()),
            }),
            type: v.literal('variable'),
          }),
        ]),
      ),
    ),
  ]),
  asControl(),
  // v.custom<SimplifiedState>((input) => !!input && Array.isArray(input)),
  setComponent('textarea-template'),
  actions.class.top('nodrag'),
);
