import { actions, setComponent } from '@piying/view-angular-core';
import * as v from 'valibot';
import type { SimplifiedState } from '@shenghuabi/lexical-textarea';
export const TextareaTemplateDefine = v.pipe(
  v.custom<SimplifiedState>((input) => !!input && Array.isArray(input)),
  setComponent('textarea-template'),
  actions.class.top('nodrag'),
);
