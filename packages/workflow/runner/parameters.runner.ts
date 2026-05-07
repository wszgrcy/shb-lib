import { NodeRunnerBase } from './runner-item';
// 内部使用,用于预计算
export class ParametersRunner extends NodeRunnerBase {
  static runnerName = 'parameters' as const;

  override async run() {
    return async () => ({ value: this.inputs$$() });
  }
}
