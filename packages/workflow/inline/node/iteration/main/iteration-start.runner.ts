import { inject } from 'static-injector';
import { NodeParentMapToken } from '../../../../token';
import { NodeRunnerBase } from '../../../../runner/runner-item';
export class IterationStartRunner extends NodeRunnerBase {
  #nodeParentMap = inject(NodeParentMapToken);

  override async run() {
    return async (name: string) =>
      this.#nodeParentMap.get(this.callNode.id)![name];
  }
}
