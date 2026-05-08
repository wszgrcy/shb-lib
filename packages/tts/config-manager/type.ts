import { v5 } from 'uuid';
import * as v from 'valibot';
import { LanguageList, UUID_NS } from '../const';
import {
  EmoType1Define,
  EmoType2Define,
  EmoType3Define,
  EmoType4Define,
} from '../define';
import { asColumn } from '../util/define-helper';
import {
  asControl,
  actions,
  setComponent,
} from '@piying/view-angular-core';
import { deepEqual } from 'fast-equals';
import { BehaviorSubject } from 'rxjs';
const EmoSaveDefine = v.pipe(
  v.union([
    v.pipe(
      v.strictObject({
        // 外部引用
        preset: v.pipe(
          v.custom<RefFindType>((a) => !!a),
          setComponent('picklist'),
          v.title('引用'),
          actions.inputs.patch({
            compareWith: deepEqual,
          }),
          actions.inputs.patchAsync({
            options: (field) => {
              const subject = new BehaviorSubject<any[]>([]);
              field.context['getAudioReferenceList']().then((list: any[]) => {
                subject.next(list);
                if (!field.form.control?.value && list.length) {
                  field.form.control?.updateValue(list[0].value);
                }
              });
              return subject;
            },
          }),
        ),
      }),
      v.title('预设'),
    ),
    EmoType1Define,
    EmoType2Define,
    EmoType3Define,
    EmoType4Define,
  ]),
  setComponent('radio-group'),
);
export const ReferenceCommonDefine = v.object({
  player: v.pipe(v.optional(v.string(), 'default'), v.title('名字')),
  state: v.pipe(v.optional(v.string(), 'default'), v.title('状态')),
  language: v.pipe(
    v.optional(v.string(), 'chinese'),
    v.title('语言'),
    setComponent('picklist'),
    actions.inputs.patch({ options: LanguageList }),
  ),
  aliases: v.pipe(
    v.optional(v.array(v.string())),
    v.title('别名'),
    asControl(),
    setComponent('chip-input-list'),
    actions.inputs.patch({ addOnBlur: true }),
  ),
});
export type ReferenceCommonType = v.InferInput<typeof ReferenceCommonDefine>;
export type RefFindType = {
  player: string;
  state: string;
  language: string;
};
export const ReferenceItem = v.pipe(
  ReferenceCommonDefine,
  v.transform((item) => ({
    ...item,
    player: item.player ?? 'default',
    state: item.state ?? 'default',
    language: item.language ?? 'default',
    id: v5(
      `${item.player}-${item.state}-${item.language ?? 'default'}`,
      UUID_NS,
    ),
  })),
);
/** 通用的 */
export const IndexTTSRefItemDefine = v.object({
  ...ReferenceCommonDefine.entries,
  config: EmoSaveDefine,
});
export const IndexTTSRefItemSaveDefine = v.pipe(
  IndexTTSRefItemDefine,
  v.transform((item) => ({
    ...item,
    player: item.player ?? 'default',
    state: item.state ?? 'default',
    language: item.language ?? 'default',
    id: v5(
      `${item.player}-${item.state}-${item.language ?? 'default'}`,
      UUID_NS,
    ),
  })),
);
export type IndexTTSRefItemSaveType = v.InferInput<
  typeof IndexTTSRefItemSaveDefine
>;
export const IndexTTSRefItemFormDefine = v.pipe(
  IndexTTSRefItemDefine,
  asColumn(),
);
export type ReferenceDefineInput = v.InferInput<typeof ReferenceItem>;
export type ReferenceCommonDefineOutPut = v.InferOutput<
  typeof ReferenceCommonDefine
> & { id?: string };
// export type aaa = v.InferOutput<typeof ReferenceItem>;
export type ReferenceInput = Omit<ReferenceDefineInput, 'filePath'>;
export function defineParse<T extends v.BaseSchema<any, any, any>>(
  schema: T,
  data: v.InferInput<T>,
) {
  return v.parse(schema, data);
}
export const VoiceListDefine = v.optional(
  v.array(
    v.intersect([
      ReferenceItem,
      v.object({
        filePath: v.string(),
      }),
    ]),
  ),
  [],
);
export type VoiceListType = v.InferOutput<typeof VoiceListDefine>;
export const EmoListDefine = v.optional(
  v.array(
    v.object({
      id: v.string(),
      ...IndexTTSRefItemDefine.entries,
    }),
  ),
  [],
);
export type EmoListType = v.InferOutput<typeof EmoListDefine>;
export const ManagerConfigDefine = v.object({
  references: VoiceListDefine,
  defaultLanguagePlayerReference: v.record(v.string(), v.string()),
  defaultPlayerStateReference: v.record(v.string(), v.string()),
  indexTTSEmoReferences: EmoListDefine,
});

export function getDefaultManagerConfig() {
  return defineParse(ManagerConfigDefine, {
    references: [],
    defaultLanguagePlayerReference: {},
    defaultPlayerStateReference: {},
    indexTTSEmoReferences: [],
  });
}
export type ManagerConfigType = v.InferOutput<typeof ManagerConfigDefine>;

export type ReferenceSaveItem = ManagerConfigType['references'][number];
