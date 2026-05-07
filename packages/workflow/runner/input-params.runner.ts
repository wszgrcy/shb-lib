import { inject } from 'static-injector';
import { NodeRunnerBase } from './runner-item';
import { EnviromentParametersToken } from '../token';
export class InputParamsRunner extends NodeRunnerBase {
  #env = inject(EnviromentParametersToken);
  override async run() {
    return async () => {
      const value = this.#env;
      if (!value) {
        throw new Error(`读取上下文失败`);
      }
      return {
        value: value,
      };
    };
  }
}
