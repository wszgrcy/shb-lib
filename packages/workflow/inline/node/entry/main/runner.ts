import { inject } from 'static-injector';
import { NodeRunnerBase } from '../../../../runner/runner-item';
import { EnviromentParametersToken } from '../../../../token';
export class InputParamsRunner extends NodeRunnerBase {
  #env = inject(EnviromentParametersToken);
  override async run() {
    const data = this.#env!;
    return async (id?: string) => {
      if (!id || id === '[default]') {
        return data;
      }
      if (id === '[rest]') {
        return data;
      }
      return data![id];
    };
  }
}
