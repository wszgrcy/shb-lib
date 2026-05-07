import * as v from 'valibot';
import { InjectionToken, Signal } from 'static-injector';
import { BackendDefine } from './tts-backend.type';
import {
  INTERVAL_DEFINE,
  ParagraphIntervalDefine,
  SPEEDCONTROL_DEFINE,
} from './audio-options.define';
import { asVirtualGroup } from '@piying/view-angular-core';
import { asRow, asColumn } from '../util/define-helper';

export const TTSConfigDefine = v.object({
  audioOptions: v.pipe(
    v.optional(
      v.intersect([
        v.pipe(
          v.object({
            ...ParagraphIntervalDefine.entries,
            ...INTERVAL_DEFINE.entries,
          }),

          asRow(),
        ),
        SPEEDCONTROL_DEFINE,
      ]),
    ),
    asVirtualGroup(),
    asColumn(),
  ),
  workflowPath: v.pipe(
    v.optional(v.string(), 'default/[TTS]基础文本解析'),
    v.title('工作流'),
  ),
  plugin: v.pipe(
    v.optional(
      v.object({
        activatedChangeAudioItemList: v.optional(
          v.array(v.object({ name: v.string() })),
        ),
        activatedBeforeConcatList: v.optional(
          v.array(v.object({ name: v.string() })),
        ),
        activatedAfterConcatList: v.optional(
          v.array(v.object({ name: v.string() })),
        ),
      }),
    ),
  ),
  backend: BackendDefine,
});
export type TTSConfigType = v.InferOutput<typeof TTSConfigDefine>;
export const TTSConfigToken = new InjectionToken<Signal<TTSConfigType>>('TTS');
