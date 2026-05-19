import { v4 } from 'uuid';
import type { ChatMessageListOutputType } from '@shenghuabi/openai';
import * as v from 'valibot';
import { ChatMetadata } from './type';
import { InputInvalidItem } from './handle-node';

export type WorkflowRunnerEnvironmentParams = Record<string, any>;
export type WorkflowRunnerInputsWithContext = {
  inputs: InputInvalidItem[];
  environmentParameters?: WorkflowRunnerEnvironmentParams;
};

export interface WorkflowExtraMetadata {
  metadata: ChatMetadata;
}
const extraData = v.looseObject({
  references: v.optional(v.array(v.custom<ChatMetadata>(Boolean))),
});
const baseDataDefine = v.object({
  node: v.object({ type: v.string(), id: v.string() }),
  nodeResult: v.pipe(v.optional(v.boolean(), false)),
  dataId: v.optional(v.string(), () => v4()),
  extra: v.optional(extraData),
});
export const CommonDataDefine = v.object({
  ...baseDataDefine.entries,
  value: v.any(),
});
export type CommonDataType = v.InferOutput<typeof CommonDataDefine>;

export const LLMDataDefine = v.object({
  ...baseDataDefine.entries,
  type: v.optional(v.literal('chat-stream'), 'chat-stream'),
  // 用来进行普通查询
  value: v.string(),
  extra: v.object({
    ...extraData.entries,
    content: v.string(),
    thinkContent: v.optional(v.string()),
    isThinking: v.optional(v.boolean()),
    delta: v.string(),
    historyList: v.custom<ChatMessageListOutputType>(Boolean),
  }),
});
export type LLMWorkflowData = v.InferOutput<typeof LLMDataDefine>;
export function createLLMData(data: v.InferInput<typeof LLMDataDefine>) {
  return v.parse(LLMDataDefine, data);
}
export function createResultData(data: v.InferInput<typeof CommonDataDefine>) {
  const result = v.parse(CommonDataDefine, data);
  result.nodeResult = true;
  return result;
}
export type WorkflowStreamData =
  | v.InferOutput<typeof CommonDataDefine>
  | v.InferOutput<typeof LLMDataDefine>;
