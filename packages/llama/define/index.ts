import * as v from 'valibot';
import { LlamaServerSwapItemDefine } from './llama-server.define';
import { LlamaSwapDefine } from './llama-swap.define';
import { ExampleSpecificDefine } from './example-specific.define';
export * from './llama-server.define';
export * from './common.define';
export * from './example-specific.define';
export * from './sampling.define';
import { CommonDefine } from './common.define';

export const LlamaConfigDefine = v.object({
  server: v.object({
    global: v.optional(LlamaServerSwapItemDefine),
    list: v.array(LlamaServerSwapItemDefine),
  }),
  swap: v.optional(LlamaSwapDefine),
});

export type ExampleSpecificType = v.InferOutput<typeof ExampleSpecificDefine>;
export type LlamaConfigInputType = v.InferInput<typeof LlamaConfigDefine>;

export type LLamaCommonType = v.InferInput<typeof CommonDefine>;

export const DefaultCommonConfig: LLamaCommonType = {
  'gpu-layers': {
    enable: true,
    value: [999],
  },
  'flash-attn': {
    enable: true,
    value: ['on'],
  },
};
