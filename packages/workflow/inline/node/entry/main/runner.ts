import { inject } from 'static-injector';
import { NodeRunnerBase } from '../../../../runner/runner-item';
import { EnviromentParametersToken } from '../../../../token';
export class InputParamsRunner extends NodeRunnerBase {
  #env = inject(EnviromentParametersToken);
  override async run() {
    const data = this.#env!;
    return async (name?: string) => {
      if (!name || name === '[default]') {
        return data;
      }
      if (name === '[rest]') {
        return data;
      }
      return data![name];
    };
  }
}
