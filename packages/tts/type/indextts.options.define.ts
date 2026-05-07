import { InjectionToken, Signal } from 'static-injector';
import * as v from 'valibot';
export const GenerationOption = v.object({
  do_sample: v.pipe(
    v.optional(v.boolean(), true),
    v.title('采样'),
    v.description('是否进行采样'),
  ),
  top_p: v.pipe(
    v.optional(v.number(), 0.8),
    v.minValue(0),
    v.maxValue(0.8),
    v.metadata({ step: 0.01 }),
  ),
  top_k: v.pipe(
    v.optional(v.number(), 30),
    v.minValue(0),
    v.maxValue(100),
    v.metadata({ step: 1 }),
  ),
  temperature: v.pipe(
    v.optional(v.number(), 1),
    v.minValue(0.1),
    v.maxValue(2),
    v.metadata({ step: 0.1 }),
  ),
  length_penalty: v.pipe(
    v.optional(v.number(), 0),
    v.minValue(-2),
    v.maxValue(2),
    v.metadata({ step: 0.1 }),
  ),
  num_beams: v.pipe(
    v.optional(v.number(), 3),
    v.minValue(1),
    v.maxValue(10),
    v.metadata({ step: 1 }),
  ),
  repetition_penalty: v.pipe(
    v.optional(v.number(), 10),
    v.minValue(0.1),
    v.maxValue(20),
    v.metadata({ step: 0.1 }),
  ),
  max_mel_tokens: v.pipe(
    v.optional(v.number(), 1500),
    v.minValue(50),
    v.maxValue(1815),
    v.metadata({ step: 10 }),
    v.description('生成Token最大数量，过小导致音频被截断'),
  ),
});

export const SentenceConfig = v.object({
  max_text_tokens_per_segment: v.pipe(
    v.optional(v.number(), 120),
    v.description(
      '建议80~200之间，值越大，分句越长；值越小，分句越碎；过小过大都可能导致音频质量不高',
    ),
    v.title('分句最大Token数'),
    v.minValue(20),
    v.maxValue(600),
    v.metadata({
      step: 2,
    }),
  ),
  sentences_bucket_max_size: v.pipe(
    v.optional(v.number(), 4),
    v.minValue(1),
    v.maxValue(16),
    v.title('分句分桶的最大容量（批次推理生效）'),
    v.description(
      '建议2-8之间，值越大，一批次推理包含的分句数越多，过大可能导致内存溢出',
    ),
    v.metadata({
      step: 1,
    }),
  ),
});

export const IndexTTSOptionsDefine = v.object({
  options: v.optional(
    v.object({
      generation: v.pipe(v.optional(GenerationOption, {}), v.title('生成')),
      sentence: v.pipe(v.optional(SentenceConfig, {}), v.title('分句')),
    }),
    {},
  ),
  loadModelParams: v.pipe(
    v.optional(
      v.object({
        use_fp16: v.pipe(v.optional(v.boolean(), true)),
        use_deepspeed: v.pipe(v.optional(v.boolean(), false)),
        use_cuda_kernel: v.pipe(v.optional(v.boolean())),
      }),
      {},
    ),
  ),
});
export type IndexTTSOutputOpions = v.InferOutput<typeof IndexTTSOptionsDefine>;
export const IndexTTSConfigToken = new InjectionToken<
  Signal<IndexTTSOutputOpions>
>('IndexTTS');
