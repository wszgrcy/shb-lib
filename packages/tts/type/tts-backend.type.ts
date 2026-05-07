import { MessageType } from '@cyia/dl';
import * as v from 'valibot';
import { TTSFileConfigType } from './audio-item.define';
import { ResolvedAudioItemType } from './resolved-audio-item.type';

export interface TTSBackendImp {
  downloadModel(
    options?:
      | {
          progressMessage?: ((item: MessageType) => void) | undefined;
        }
      | undefined,
  ): Promise<void>;

  text2speech(generationOptions: any, output: string): Promise<void>;
  configParser(
    item: any,
    config?: TTSFileConfigType,
  ): Promise<ResolvedAudioItemType>;
}
export const BackendDefine = v.pipe(
  v.optional(v.picklist(['IndexTTS-1.5', 'IndexTTS-2']), 'IndexTTS-2'),
  v.title('后端'),
);

export type BackendType = v.InferOutput<typeof BackendDefine>;
