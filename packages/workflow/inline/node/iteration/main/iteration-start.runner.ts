import { inject } from 'static-injector';
import { NodeParentMapToken } from '../../../../token';
import { NodeRunnerBase } from '../../../../runner/runner-item';
export class IterationStartRunner extends NodeRunnerBase {
  #nodeParentMap = inject(NodeParentMapToken);

  override async run() {
    const data = this.#nodeParentMap.get(this.node.parentId!)!;
    return async (id?: string) => {
      const list = this.node.outputs;
      const result = list.find((item) => item.id === id)!;
      return data[result.value];
    };
  }
}
