import { inject } from 'static-injector';
import { NodeRunnerBase } from '../../../../runner/runner-item';
import { EnviromentParametersToken } from '../../../../token';
import { RUNNER_ORIGIN_OUTPUT } from '@shenghuabi/workflow/share';
export class InputParamsRunner extends NodeRunnerBase {
  #env = inject(EnviromentParametersToken);
  override async run() {
    const data = this.#env!;
    return async (id?: string) => {
      if (!id || id === RUNNER_ORIGIN_OUTPUT[0].id) {
        return data;
      }
      if (id === '[rest]') {
        return data;
      }
      return data![id];
    };
  }
}
