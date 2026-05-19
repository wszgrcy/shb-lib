import { NodeRunnerBase } from '../../../../runner/runner-item';
import { WorkflowRunnerService } from '../../../../runner/workflow-runner.service';
import { isIterable } from '@cyia/util';
import { ITERATION_NODE_DEFINE } from '../node.define';
import { createInjector, inject } from 'static-injector';
import { CurrentCallNodeToken, NodeParentMapToken } from '../../../../token';
export class IterationRunner extends NodeRunnerBase<
  typeof ITERATION_NODE_DEFINE
> {
  #nodeParentMap = inject(NodeParentMapToken);
  override async run() {
    const inputs = this.inputs;
    const value = inputs.list;
    if (!isIterable(value)) {
      throw new Error(`输入值不是可迭代(数组)类型: ${JSON.stringify(value)}`);
    }
    const resultList: any[] = [];
    let index = 0;
    const injector = createInjector({
      providers: [{ provide: CurrentCallNodeToken, useValue: this.node }],
      parent: this.injector,
    });
    for (const item of value) {
      this.#nodeParentMap.set(this.node.id, { item });
      try {
        resultList.push(
          await this.injector
            .get(WorkflowRunnerService)
            .createContext(
              //迭代只有一个子流
              this.node.subFlowList![0].flow!,
              this.context,
              injector,
            )
            .run(),
        );
      } catch (error) {
        throw new Error(`执行第${index}出现异常`, { cause: error });
      }
      index++;
    }

    return async (id: string) => {
      if (id === 'flat') {
        return resultList.flat(999);
      }
      return resultList;
    };
  }
}
