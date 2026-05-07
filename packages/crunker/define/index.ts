import * as v from 'valibot';
const ModelList = [
  { value: 'subtitleEnd', label: '到字幕结束' },
  { value: 'nextSubtitleStart', label: '到下一字幕开始' },
  { value: 'fixed', label: '固定速率' },
] as const;
export const SpeedControlDefine = v.object({
  mode: v.pipe(
    v.optional(v.picklist(ModelList.map((item) => item.value))),
    v.metadata({
      inputs: { options: ModelList },
    }),
    v.title('变速模式'),
  ),
  ratio: v.pipe(
    v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(3))),
    v.title('变速比率'),
    v.description('固定模式:直接指定;其他模式:动态计算到合适速率,限制最大速率'),
    v.metadata({
      step: 0.05,
    }),
  ),
  minInterval: v.pipe(
    v.optional(v.number()),
    v.title('与下一句间隔(秒)'),
    v.description('保证字幕之间的最小间隔,低于此值会变速'),
  ),
});

export type SpeedControlType = v.InferOutput<typeof SpeedControlDefine>;
