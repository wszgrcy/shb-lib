import { inject } from 'static-injector';
import { NodeRunnerBase } from './runner-item';
import { EnviromentParametersToken } from '../token';
// 用于对话桥接使用
export class InlineInputItemRunner extends NodeRunnerBase {
  static runnerName = 'inlineInputItem' as const;
  #env = inject(EnviromentParametersToken);

  override async run() {
    return async () => {
      const key = this.node.inputs[0].value;
      const result = this.#env;
      if (!result) {
        throw new Error(`读取上下文参数[${key}]失败`);
      }
      return { value: result![key] };
    };
  }
}
