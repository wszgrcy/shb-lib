import { inject } from 'static-injector';
import { NodeRunnerBase } from '../../../../runner/runner-item';
import { TEXT_NODE_DEFINE } from '../text.node.define';
import { serializeLexicalTextarea } from '../../../../util/serialize-text-template';
import { EnviromentParametersToken } from '../../../../token';
import { ChatMetadata } from '@shenghuabi/workflow/share';

export class TextareaRunner extends NodeRunnerBase<typeof TEXT_NODE_DEFINE> {
  environmentContext = inject(EnviromentParametersToken)!;
  override async run() {
    return async () => {
      let metadataList: ChatMetadata[] | undefined;
      const context = await this.context$$();
      const value = serializeLexicalTextarea(this.inputs.value, {
        context,
        environmentContext: this.environmentContext,
        onMetadata(metadata) {
          metadataList = metadata;
        },
      });
      if (metadataList?.length) {
        return {
          toJSON: () => ({ ref: metadataList, value }),
          toString: () => value,
          ref: metadataList,
        };
      }
      return value;
    };
  }
}
