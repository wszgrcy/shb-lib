import { InjectionToken, Signal } from 'static-injector';
import { WorkflowRunnerContext } from './runner/workflow-runner.service';
import {
  WorkflowRunnerEnvironmentParams,
  WorkflowRunnerInputs,
} from './share/type2';

import { ChatModelOptions, ChatParamsListDefine } from '@shenghuabi/openai';
import {
  ParsedNode,
  ResolvedInputNode,
  ResolvedWorkflow,
} from './share/handle-node';
import { ChatProviderService } from '@shenghuabi/openai';
import { ChatMetadata } from './share/type';
import * as v from 'valibot';

export const CurrentWorkflowToken = new InjectionToken<ResolvedWorkflow>(
  'CurrentWorkflow',
);
export const InputsToken = new InjectionToken<WorkflowRunnerInputs>('Input');
export const CurrentNodeToken = new InjectionToken<ParsedNode>('CurrentNode');
export const CurrentCallNodeToken = new InjectionToken<ParsedNode>(
  'CurrentCallNode',
);
export const CurrentContextToken = new InjectionToken<WorkflowRunnerContext>(
  'CurrentContext',
);
export const InputParamsToken = new InjectionToken<WorkflowRunnerInputs>(
  'InputParams',
);
export const ParentContextToken = new InjectionToken<
  WorkflowRunnerContext | undefined
>('ParentContext');
/** 把输出当作什么来用， */
export const UseInputToken = new InjectionToken<ResolvedInputNode>('UseInput');
export const AbortSignalToken = new InjectionToken<AbortSignal | undefined>(
  'AbortSignal',
);
/** 环境变量 自动注入, */
export const EnviromentParametersToken = new InjectionToken<
  WorkflowRunnerEnvironmentParams | undefined
>('EnviromentParameters');
export const ModelOptionsToken = new InjectionToken<ChatModelOptions>(
  'ModelOptions',
);
export const WorkflowConfigToken = new InjectionToken<
  Signal<{
    /** 工作流保存的位置 */
    dir: string;
  }>
>('WorkflowConfig');
// 对话的服务
export const ChatServiceToken = new InjectionToken<{
  chat: (
    input: Partial<ChatModelOptions>,
  ) => ReturnType<ChatProviderService['create']>;
  getMetadataEndRef: (list?: ChatMetadata[]) => string;
  getModelConfig: (name?: string) => v.InferOutput<typeof ChatParamsListDefine>;
}>('ChatServiceToken');
