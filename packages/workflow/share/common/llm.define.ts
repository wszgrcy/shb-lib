

import * as v from 'valibot';
import { ModelConfigDefine } from '@shenghuabi/openai';
export function llmModelConfig(item?: { label: string }) {
  return v.pipe(ModelConfigDefine, v.title(item?.label ?? '对话模型'));
}

export type ModelInputConfig = v.InferOutput<ReturnType<typeof llmModelConfig>>;
