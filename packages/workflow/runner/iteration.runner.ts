import { NodeRunnerBase } from './runner-item';
import {
  ITERATION_ITEM_SYMBOL,
  WorkflowRunnerService,
} from './workflow-runner.service';
import { isIterable } from '@cyia/util';
export class IterationRunner extends NodeRunnerBase {
  override async run() {
    const data = this.inputParams.get(this.node.inputs[0].value);
    if (!data) {
      throw new Error('输入节点为空');
    }
    const extra = data.extra;
    const value = data.value;
    if (!isIterable(value)) {
      throw new Error(`输入值不是可迭代(数组)类型: ${JSON.stringify(value)}`);
    }
    const resultList: {
      extra?: any;
      value: any;
    }[] = [];
    let index = 0;
    for (const item of value) {
      const newInputs = new Map(this.inputParams);
      newInputs.set(ITERATION_ITEM_SYMBOL, {
        value: item,
        extra: extra?.[index],
      });
      try {
        resultList.push(
          await this.injector
            .get(WorkflowRunnerService)
            .createContext(
              //迭代只有一个子流
              this.node.subFlowList![0].flow!,
              newInputs,
              this.context,
              this.injector,
            )
            .run(),
        );
      } catch (error) {
        throw new Error(`执行第${index}出现异常`, { cause: error });
      }
      index++;
    }

    const list = resultList.reduce(
      (obj, item) => {
        obj.value.push(item.value);
        obj.extra.push(item.extra);
        return obj;
      },
      { value: [], extra: [] },
    );
    return async (outputName: string) => {
      if (outputName === 'flat') {
        return { value: list.value.flat(999), extra: list.extra.flat(999) };
      }
      return list;
    };
  }
}
