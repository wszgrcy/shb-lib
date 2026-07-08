import * as v from 'valibot';
import { ModelConfigDefine } from '@shenghuabi/openai';
import { setComponent } from '@piying/view-angular-core';
export function llmModelConfig(item?: { label: string }) {
  return v.pipe(
    ModelConfigDefine,
    v.title(item?.label ?? '对话模型'),
    setComponent('reset-card'),
  );
}

export type ModelInputConfig = v.InferOutput<ReturnType<typeof llmModelConfig>>;
