import { inject } from 'static-injector';
import { NodeRunnerBase } from '../../../../runner/runner-item';
import { EnviromentParametersToken } from '../../../../token';
export class InputParamsRunner extends NodeRunnerBase {
  #env = inject(EnviromentParametersToken);
  override async run() {
    return async (name?: string) => {
      if (!name || name === '[default]') {
        return this.#env;
      }
      if (name === '[rest]') {
        return this.#env;
      }
      return this.#env![name];
    };
  }
}
