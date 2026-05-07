import * as v from 'valibot';
import {
  _PiResolvedCommonViewFieldConfig,
  asVirtualGroup,
  componentClass,
  hideWhen,
  NFCSchema,
  patchAsyncInputs,
  patchInputs,
  patchProps,
  renderConfig,
  setComponent,
  setWrappers,
  topClass,
} from '@piying/view-angular-core';
import { BehaviorSubject, from, map } from 'rxjs';
import { metadataPipe } from '@piying/valibot-visit';
import { deepEqual } from 'fast-equals';
import { asRow, asColumn } from '../util/define-helper';
import {
  INTERVAL_DEFINE,
  isParagraphDefine,
  ParagraphIntervalDefine,
  SPEEDCONTROL_DEFINE,
} from './audio-options.define';
import { RefFindType } from '../config-manager/type';
export const AudioReferenceDefine = v.pipe(
  // 通过具体引用查询,减少工作流部分实现
  v.custom<RefFindType>((a) => !!a),
  setComponent('picklist'),
  v.title('使用配音'),
  patchInputs({
    compareWith: deepEqual,
  }),
  patchAsyncInputs({
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
);
const emoVectorItemDefine = v.pipe(
  v.optional(v.number(), 0),
  setComponent('slider'),
  patchInputs({ min: 0, max: 1, step: 0.05 }),
);
const use_randomDefine = v.pipe(
  v.optional(v.boolean(), false),
  v.title('情感随机采样'),
  setWrappers(['label']),
  patchProps({ titlePosition: 'right' }),
);
const TopLabel = metadataPipe(
  patchProps({ titlePosition: 'top' }),
  setWrappers([{ type: 'label' }]),
);
export const EmoPresetDefine = v.pipe(
  v.strictObject({
    // 外部引用
    preset: v.pipe(
      v.custom<RefFindType>((a) => !!a),
      setComponent('picklist'),
      v.title('引用'),
      patchInputs({
        compareWith: deepEqual,
      }),
      patchAsyncInputs({
        options: (field) => {
          const subject = new BehaviorSubject<any[]>([]);
          field.context['getIndexTTSEmoReferenceList']().then((list: any[]) => {
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
);
export const EmoType1Define = v.pipe(
  v.strictObject({
    emo_alpha: v.pipe(
      v.optional(v.literal(1), 1),
      renderConfig({ hidden: true }),
      setComponent(''),
    ),
  }),
  v.title('与音色参考音频相同'),
);
export const EmoType2Define = v.pipe(
  v.strictObject({
    emo_audio_prompt: v.pipe(AudioReferenceDefine, v.title('情感参考音频')),
    emo_alpha: v.pipe(
      v.optional(v.number(), 1),
      patchInputs({ min: 0, max: 1, step: 0.01 }),
      v.title('情感权重'),
      setComponent('slider'),
      setWrappers(['label']),
      patchProps({ titlePosition: 'top' }),
    ),
  }),
  v.title('使用情感参考音频'),
);
export const EmoType3Define = v.pipe(
  v.strictObject({
    use_random: use_randomDefine,
    emo_vector: v.pipe(
      v.tuple([
        v.pipe(emoVectorItemDefine, v.title('喜'), ...TopLabel),
        v.pipe(emoVectorItemDefine, v.title('怒'), ...TopLabel),
        v.pipe(emoVectorItemDefine, v.title('哀'), ...TopLabel),
        v.pipe(emoVectorItemDefine, v.title('惧'), ...TopLabel),
        v.pipe(emoVectorItemDefine, v.title('厌恶'), ...TopLabel),
        v.pipe(emoVectorItemDefine, v.title('低落'), ...TopLabel),
        v.pipe(emoVectorItemDefine, v.title('惊喜'), ...TopLabel),
        v.pipe(emoVectorItemDefine, v.title('平静'), ...TopLabel),
      ]),
      componentClass('grid gap-4 grid-cols-2'),
      setWrappers(['alert-valid']),
      patchProps({
        validPosition: 'bottom',
      }),
    ),
  }),
  v.title('使用情感向量控制'),
);
export const EmoType4Define = v.pipe(
  v.strictObject({
    use_random: use_randomDefine,
    emo_text: v.pipe(
      v.string(),
      v.title('情感描述文本'),
      v.description('例如：高兴，愤怒，悲伤等'),
    ),
    use_emo_text: v.pipe(
      v.optional(v.literal(true), true),
      renderConfig({ hidden: true }),
      setComponent(''),
    ),
  }),
  v.title('使用情感描述文本控制'),
  componentClass('grid gap-2'),
);
export const EmoDefine = v.pipe(
  v.union([
    EmoPresetDefine,
    EmoType1Define,
    EmoType2Define,
    EmoType3Define,
    EmoType4Define,
  ]),
  setComponent('radio-group'),
);
export type EmoType = v.InferOutput<typeof EmoDefine>;
export type EmoInputType = v.InferInput<typeof EmoDefine>;

const FileConfig = v.pipe(
  v.intersect([
    v.pipe(
      v.object({
        referenceMap: v.pipe(
          v.optional(
            v.object({
              chinese: v.pipe(
                v.optional(AudioReferenceDefine),
                v.title('中文'),
              ),
              english: v.pipe(
                v.optional(AudioReferenceDefine),
                v.title('英文'),
              ),
            }),
          ),
          asRow(),
        ),
        generateOptions: v.optional(
          v.object({
            emo: v.pipe(
              v.optional(EmoDefine),
              renderConfig({ hidden: true }),
              hideWhen({
                listen(fn, field) {
                  return from(field.context['showIndexTTSEmo']()).pipe(
                    map((a) => !a),
                  ) as any;
                },
              }),
            ),
          }),
        ),
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
      }),
      asColumn(),
    ),
    v.pipe(
      v.object({
        __btn1: v.pipe(
          NFCSchema,
          setComponent('button'),
          patchInputs({ label: '插件处理' }),
          patchAsyncInputs({
            clicked: (field) => async () => {
              const listFiled = field.get(['#', 'list'])!;
              const result = await field.context['changeAudioList'](
                listFiled.form.control!.value,
              );
              listFiled.form.control!.updateValue(result);
            },
          }),
        ),
        __btn2: v.pipe(
          NFCSchema,
          setComponent('button'),
          patchInputs({ label: '重置', color: 'warn' }),
          patchAsyncInputs({
            clicked: (field) => async () => {
              const listFiled = field.get(['#', 'list'])!;
              const result = await field.context['resetAudioList'](
                listFiled.form.control!.value,
              );
              listFiled.form.control!.updateValue(result);
            },
          }),
        ),
        __btn3: v.pipe(
          NFCSchema,
          setComponent('button'),
          patchInputs({ label: '文本到语音', type: 'flat' }),
          patchAsyncInputs({
            clicked: (field) => () => field.context['apply'](),
          }),
        ),
        __btn4: v.pipe(
          NFCSchema,
          setComponent('button'),
          patchInputs({ label: '查看日志' }),
          patchAsyncInputs({
            clicked: (field) => () => field.context['openLog'](),
          }),
        ),
      }),
      asRow(2),
    ),
  ]),
  componentClass('self-start grid gap-2', true),
  asVirtualGroup(),
);
const GenerateOptionsDefine = v.pipe(
  v.intersect([
    v.object({
      audioText: v.pipe(
        v.optional(v.string()),
        v.title('生成文本'),
        v.description('生成音频时传入的内容,为空时使用字幕文本(非空字符串)'),
        setWrappers(['tooltip', 'form-field-reset-suffix', 'form-field']),
      ),
    }),
    v.pipe(
      v.object({
        reference: v.pipe(
          v.union([
            v.pipe(
              v.optional(
                v.object({
                  language: v.pipe(
                    v.picklist(['chinese', 'english']),
                    v.title('音频语言'),
                    v.description('用于自动选择默认语言'),
                  ),
                }),
                { language: 'chinese' },
              ),
              v.title('按语言'),
            ),
            v.pipe(
              v.object({
                preset: v.pipe(AudioReferenceDefine),
              }),
              v.title('指定'),
            ),
          ]),
          setComponent('radio-group'),
          v.title('配音'),
        ),
        emo: v.pipe(EmoDefine, v.title('情绪控制')),
      }),
      setComponent('tab-group'),
    ),
  ]),

  asColumn(),
);
export type GenerateOptionsType = v.InferOutput<typeof GenerateOptionsDefine>;
export const AudioItemDefine = v.pipe(
  v.intersect([
    v.pipe(
      v.object({
        subtitle: v.pipe(
          v.intersect([
            v.pipe(
              v.object({
                start: v.pipe(v.optional(v.number()), v.title('开始(秒)')),
                end: v.pipe(v.optional(v.number()), v.title('结束(秒)')),
              }),
              componentClass('grid grid-cols-2 col-span-1 gap-2'),
            ),
            v.pipe(
              v.object({
                text: v.pipe(v.optional(v.string(), ''), v.title('字幕')),
              }),
              componentClass('col-span-3'),
            ),
          ]),
          asVirtualGroup(),
          componentClass('grid grid-cols-4 gap-2'),
        ),
      }),
    ),
    v.pipe(
      v.object({
        generateOptions: GenerateOptionsDefine,
        audioOptions: v.pipe(
          v.intersect([
            v.pipe(
              v.object({
                isParagraph: isParagraphDefine,
                ...INTERVAL_DEFINE.entries,
              }),
              asRow(),
            ),
            SPEEDCONTROL_DEFINE,
          ]),
          asVirtualGroup(),
          asColumn(),
        ),
      }),
      asColumn(),
    ),
    v.pipe(
      v.object({
        origin: v.pipe(
          v.optional(v.any()),
          renderConfig({ hidden: true }),
          setComponent(''),
        ),
        metadata: v.pipe(
          v.optional(v.any()),
          renderConfig({ hidden: true }),
          setComponent(''),
        ),
      }),
    ),
  ]),
  asVirtualGroup(),
  componentClass('grid gap-2'),
);
export type AudioItemType = v.InferOutput<typeof AudioItemDefine>;
export const TTSFileConfigDefine = v.pipe(
  v.object({
    list: v.pipe(
      v.array(AudioItemDefine),
      setComponent('card-array'),
      patchInputs({
        enableLineInsert: true,
        actions: [
          {
            type: 'audio',
            url$$: (field: _PiResolvedCommonViewFieldConfig, index: number) =>
              field.context['getAudioItemOutputFile'](index),
          },
          {
            icon: 'undo',
            color: 'warn',
            tooltip: `将此项恢复到原始状态`,
            fn: async (field: _PiResolvedCommonViewFieldConfig) => {
              const result = await field.context['resetAudioItem'](
                field.form.control!.value,
              );
              field.form.control?.updateValue(result);
            },
          },

          {
            label: '使用插件',
            tooltip: `使用单一插件`,
            type: 'list',
            children$$: (field: _PiResolvedCommonViewFieldConfig) =>
              field.context['getAudioPluginList']().then((list: string[]) =>
                list.map((item) => ({
                  label: item,
                  fn: async () => {
                    const result = await field.context!['changeAudioItem'](
                      field.form.control!.value,
                      item,
                    );
                    field.form.control!.updateValue(result);
                  },
                })),
              ),
            fn: async (field: _PiResolvedCommonViewFieldConfig) => {
              const result = await field.context['changeAudioItem'](
                field.form.control!.value,
              );
              field.form.control!.updateValue(result);
            },
          },
          {
            label: '插件处理',
            tooltip: `使用插件重新对内容进行处理`,
            fn: async (field: _PiResolvedCommonViewFieldConfig) => {
              const result = await field.context['changeAudioItem'](
                field.form.control!.value,
              );
              field.form.control!.updateValue(result);
            },
          },
        ],
      }),

      topClass('col-span-3'),
    ),
    fileConfig: v.pipe(FileConfig, topClass('sticky top-4 col-span-2', true)),
    version: v.pipe(
      v.optional(v.literal(1), 1),
      setComponent(''),
      renderConfig({ hidden: true }),
    ),
    output: v.pipe(
      v.optional(v.any()),
      setComponent(''),
      renderConfig({ hidden: true }),
    ),
  }),
  componentClass('grid grid-cols-5 gap-2 '),
);

export type TTSFileConfigType = v.InferOutput<typeof TTSFileConfigDefine>;
