import { InjectionToken, Signal } from 'static-injector';
import { WorkflowRunnerContext } from './runner/workflow-runner.service';
import { WorkflowRunnerEnvironmentParams } from './share/type2';

import {
  InputInvalidItem,
  ParsedNode,
  ResolvedWorkflow,
} from './share/handle-node';
import { ModelConfigInputType } from '@shenghuabi/openai';

export const CurrentWorkflowToken = new InjectionToken<ResolvedWorkflow>(
  'CurrentWorkflow',
);
export const InputsToken = new InjectionToken<
  Record<string, (InputInvalidItem & { value: any })[]>
>('Inputs');
export const NodeInputsToken = new InjectionToken<any>('NodeInputs');
export const NodeContextToken = new InjectionToken<
  () => Promise<Record<string, any>>
>('NodeContext');
export const NodeParentMapToken = new InjectionToken<
  Map<string, Record<string, any>>
>('NodeParentMap');
export const CurrentNodeToken = new InjectionToken<ParsedNode>('CurrentNode');
export const CurrentCallNodeToken = new InjectionToken<ParsedNode>(
  'CurrentCallNode',
);
export const CurrentContextToken = new InjectionToken<WorkflowRunnerContext>(
  'CurrentContext',
);

export const ParentContextToken = new InjectionToken<
  WorkflowRunnerContext | undefined
>('ParentContext');

export const AbortSignalToken = new InjectionToken<AbortSignal | undefined>(
  'AbortSignal',
);
/** 环境变量 自动注入, */
export const EnviromentParametersToken = new InjectionToken<
  WorkflowRunnerEnvironmentParams | undefined
>('EnviromentParameters');
export const ModelOptionsToken = new InjectionToken<ModelConfigInputType>(
  'ModelOptions',
);
export const WorkflowConfigToken = new InjectionToken<
  Signal<{
    /** 工作流保存的位置 */
    dir: string;
  }>
>('WorkflowConfig');
