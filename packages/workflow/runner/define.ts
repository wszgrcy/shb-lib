import { WorkflowNodeType } from '../share/workflow.const';
import { InlineInputItemRunner } from './inline-input-item.runner';
import { InputParamsRunner } from './input-params.runner';
import { IterationStartRunner } from './iteration-start.runner';
import { IterationRunner } from './iteration.runner';
import { ParametersRunner } from './parameters.runner';

export const ItemRunnerObject = {
  [WorkflowNodeType.iteration]: IterationRunner,
  [WorkflowNodeType.iterationStart]: IterationStartRunner,
  [WorkflowNodeType.inputParams]: InputParamsRunner,
  [WorkflowNodeType.parameters]: ParametersRunner,
  [WorkflowNodeType.inlineInputItem]: InlineInputItemRunner,
};
