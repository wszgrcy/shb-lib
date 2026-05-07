import * as v from 'valibot';
import { CommonDefine } from './common.define';
import { ExampleSpecificDefine } from './example-specific.define';
import { SamplingDefine } from './sampling.define';

export const LlamaServerDefine = v.object({
  common: v.optional(CommonDefine),
  exampleSpecific: v.optional(ExampleSpecificDefine),
  sampling: v.optional(SamplingDefine),
});
export type LlamaServerType = v.InferOutput<typeof LlamaServerDefine>;
export const ExecDefine = v.object({
  version: v.pipe(
    v.string(),
    v.title('llama.cpp 版本号'),
    v.description(
      'llama.cpp的版本号,可以从 https://github.com/ggerganov/llama.cpp/releases 获得',
    ),
  ),
  device: v.pipe(
    v.picklist(['cpu', 'cuda12.4', 'hip-radeon', 'sycl', 'vulkan']),

    v.title('llama.cpp 使用设备'),
  ),
});

export const LlamaServerSwapItemDefine = v.object({
  // url: v.pipe(v.optional(v.string()), v.description(`访问地址,默认不需要改,如果`)),
  config: v.optional(LlamaServerDefine),
  aliases: v.optional(v.array(v.string())),
  env: v.optional(v.record(v.string(), v.any())),
  ttl: v.optional(v.number()),
  checkEndpoint: v.optional(v.string()),
  useModelName: v.optional(v.string()),
  exec: v.optional(v.union([v.string(), ExecDefine])),
  model: v.optional(v.string()),
  proxy: v.pipe(
    v.optional(v.string()),
    v.description('正常情况下无需配置会自动生成'),
  ),
});

export type LlamaServerSwapItemType = v.InferOutput<
  typeof LlamaServerSwapItemDefine
>;
export type LlamaServerSwapItemInputType = v.InferInput<
  typeof LlamaServerSwapItemDefine
>;
