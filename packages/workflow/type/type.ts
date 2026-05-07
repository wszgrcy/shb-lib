import type { NodeRunnerBase } from '../runner/runner-item';
import { NodeComponentType } from '../share/type';

export type NodeItemDefine = NodeComponentType & {
  runner: typeof NodeRunnerBase;
};
