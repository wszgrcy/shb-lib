import { WorkflowNodeType } from '../share/workflow.const';
import { InputParamsRunner } from '../inline/node/entry/main/runner';
import { IterationRunner } from '../inline/node/iteration/main/runner';
import { IterationStartRunner } from '../inline/node/iteration/main/iteration-start.runner';

export const ItemRunnerObject = {
  [WorkflowNodeType.iteration]: IterationRunner,
  [WorkflowNodeType.iterationStart]: IterationStartRunner,
  [WorkflowNodeType.inputParams]: InputParamsRunner,
};
