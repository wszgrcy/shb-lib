import { NodeRunnerBase } from './runner-item';
import { ITERATION_ITEM_SYMBOL } from './workflow-runner.service';
export class IterationStartRunner extends NodeRunnerBase {
  override async run() {
    return async () => this.inputParams.get(ITERATION_ITEM_SYMBOL)!;
  }
}
