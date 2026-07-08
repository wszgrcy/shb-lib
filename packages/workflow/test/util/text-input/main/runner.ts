import { NodeRunnerBase } from '../../../../runner/runner-item';
import { TEXT_NODE_DEFINE } from '../text.node.define';

export class TextInputRunner extends NodeRunnerBase<typeof TEXT_NODE_DEFINE> {
  override async run() {
    return async () => this.inputs.value;
  }
}
