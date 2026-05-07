import { inject } from 'static-injector';
import { NodeRunnerBase } from '../../../../runner/runner-item';
import { TemplateFormatService } from '../../../../template-format.service';

export class TextareaRunner extends NodeRunnerBase {
  #format = inject(TemplateFormatService);
  override async run() {
    const obj = this.inputValueObject$$();
    const str = this.node.data.value as string;
    return async () => ({ value: this.#format.interpolate(str, obj) });
  }
}
