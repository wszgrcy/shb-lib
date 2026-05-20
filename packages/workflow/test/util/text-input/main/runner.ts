import { inject } from 'static-injector';
import { NodeRunnerBase } from '../../../../runner/runner-item';
import { TEXT_NODE_DEFINE } from '../text.node.define';
import { EnviromentParametersToken } from '../../../../token';

export class TextInputRunner extends NodeRunnerBase<typeof TEXT_NODE_DEFINE> {
  environmentContext = inject(EnviromentParametersToken)!;
  override async run() {
    return async () => this.inputs.value;
  }
}
