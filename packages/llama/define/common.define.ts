import * as v from 'valibot';
const STR_SCHEMA = v.pipe(v.string(), v.trim());
export const CommonDefine = v.object({
  'verbose-prompt': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 在生成前打印详细提示（默认：false）\n- print a verbose prompt before generation (default: false)',
    ),
  ),
  threads: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 生成期间使用的线程数（默认：-1）\n- number of threads to use during generation (default: -1)  (env: LLAMA_ARG_THREADS)',
    ),
  ),
  'threads-batch': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 批量和提示处理期间使用的线程数（默认：与--threads相同）\n- number of threads to use during batch and prompt processing (default: same as --threads)',
    ),
  ),
  'cpu-mask': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('M'))])),
        ),
      }),
    ),
    v.description(
      '- CPU亲和力掩码：任意长度的十六进制数。补充cpu-range（默认：""）\n- CPU affinity mask: arbitrarily long hex. Complements cpu-range (default: "")',
    ),
  ),
  'cpu-range': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('lo-hi'))])),
        ),
      }),
    ),
    v.description(
      '- CPU范围用于亲和力。补充--cpu-mask\n- range of CPUs for affinity. Complements --cpu-mask',
    ),
  ),
  'cpu-strict': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(v.optional(v.tuple([v.picklist(['0', '1'])]))),
      }),
    ),
    v.description(
      '- 使用严格CPU放置（默认：0）\n- use strict CPU placement (default: 0)',
    ),
  ),
  prio: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(v.optional(v.tuple([v.picklist([0, 1, 2, 3])]))),
      }),
    ),
    v.description(
      '- 设置进程/线程优先级：低(-1)、正常(0)、中等(1)、高(2)、实时(3)（默认值：0）\n- set process/thread priority : low(-1), normal(0), medium(1), high(2), realtime(3) (default: 0)',
    ),
  ),
  poll: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('<0...100>'))])),
        ),
      }),
    ),
    v.description(
      '- 使用轮询级别等待工作 (0 - 无轮询，默认: 50)\n- use polling level to wait for work (0 - no polling, default: 50)',
    ),
  ),
  'cpu-mask-batch': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('M'))])),
        ),
      }),
    ),
    v.description(
      '- CPU亲和力掩码：任意长度的十六进制数。补充cpu-range-batch（默认：与--cpu-mask相同）\n- CPU affinity mask: arbitrarily long hex. Complements cpu-range-batch (default: same as --cpu-mask)',
    ),
  ),
  'cpu-range-batch': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('lo-hi'))])),
        ),
      }),
    ),
    v.description(
      '- CPU亲和力的范围。补充--cpu-mask-batch\n- ranges of CPUs for affinity. Complements --cpu-mask-batch',
    ),
  ),
  'cpu-strict-batch': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(v.optional(v.tuple([v.picklist(['0', '1'])]))),
      }),
    ),
    v.description(
      '- 使用严格的CPU放置（默认：与--cpu-strict相同）\n- use strict CPU placement (default: same as --cpu-strict)',
    ),
  ),
  'prio-batch': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(v.optional(v.tuple([v.picklist([0, 1, 2, 3])]))),
      }),
    ),
    v.description(
      '- 设置进程/线程优先级 : 0-正常, 1-中等, 2-高, 3-实时 (默认: 0)\n- set process/thread priority : 0-normal, 1-medium, 2-high, 3-realtime (default: 0)',
    ),
  ),
  'poll-batch': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(v.optional(v.tuple([v.picklist(['0', '1'])]))),
      }),
    ),
    v.description(
      '- 使用轮询等待工作（默认：与--poll相同）\n- use polling to wait for work (default: same as --poll)',
    ),
  ),
  'ctx-size': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 提示上下文的大小（默认：4096，0 = 从模型加载）\n- size of the prompt context (default: 4096, 0 = loaded from model)  (env: LLAMA_ARG_CTX_SIZE)',
    ),
  ),
  predict: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 预测的token数量（默认：-1，-1 = 无限）\n- number of tokens to predict (default: -1, -1 = infinity)  (env: LLAMA_ARG_N_PREDICT)',
    ),
  ),
  'batch-size': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 逻辑最大批处理大小（默认：2048）\n- logical maximum batch size (default: 2048)  (env: LLAMA_ARG_BATCH)',
    ),
  ),
  'ubatch-size': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 物理最大批处理大小（默认：512）\n- physical maximum batch size (default: 512)  (env: LLAMA_ARG_UBATCH)',
    ),
  ),
  keep: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 保留初始提示中的令牌数量（默认：0，-1 = 所有）\n- number of tokens to keep from the initial prompt (default: 0, -1 = all)',
    ),
  ),
  'swa-full': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用全尺寸SWA缓存（默认：false） [更多信息](https://github.com/ggml-org/llama.cpp/pull/13194#issuecomment-2868343055)\n- use full-size SWA cache (default: false)  [(more info)](https://github.com/ggml-org/llama.cpp/pull/13194#issuecomment-2868343055)  (env: LLAMA_ARG_SWA_FULL)',
    ),
  ),
  'kv-unified': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 为所有序列的 KV 缓存使用一个统一的 KV 缓冲区（默认值为 `false`）：[更多信息](https://github.com/ggml-org/llama.cpp/pull/14363)（环境变量：`LLAMA_ARG_KV_SPLIT`）\n- use single unified KV buffer for the KV cache of all sequences (default: false)  [(more info)](https://github.com/ggml-org/llama.cpp/pull/14363)  (env: LLAMA_ARG_KV_SPLIT)',
    ),
  ),
  'flash-attn': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(v.optional(v.tuple([v.picklist(['on', 'off', 'auto'])]))),
      }),
    ),
    v.description(
      "- 启用 Flash 注意力（默认：禁用）\n- set Flash Attention use ('on', 'off', or 'auto', default: 'auto')  (env: LLAMA_ARG_FLASH_ATTN)",
    ),
  ),
  'no-perf': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 禁用内部libllama性能计时（默认：false）\n- disable internal libllama performance timings (default: false)  (env: LLAMA_ARG_NO_PERF)',
    ),
  ),
  escape: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 处理转义序列（\\n, \\r, \\t, \\", \\\\)（默认：true）\n- process escapes sequences (\\n, \\r, \\t, \\\', \\", \\\\) (default: true)',
    ),
  ),
  'no-escape': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description('- 不要处理转义序列\n- do not process escape sequences'),
  ),
  'rope-scaling': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.picklist(['none', 'linear', 'yarn'])])),
        ),
      }),
    ),
    v.description(
      '- RoPE频率缩放方法，除非模型指定，默认为线性\n- RoPE frequency scaling method, defaults to linear unless specified by the model  (env: LLAMA_ARG_ROPE_SCALING_TYPE)',
    ),
  ),
  'rope-scale': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- RoPE上下文缩放因子，将上下文扩展N倍\n- RoPE context scaling factor, expands context by a factor of N  (env: LLAMA_ARG_ROPE_SCALE)',
    ),
  ),
  'rope-freq-base': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- RoPE基频，用于NTK感知缩放（默认：从模型加载）\n- RoPE base frequency, used by NTK-aware scaling (default: loaded from model)  (env: LLAMA_ARG_ROPE_FREQ_BASE)',
    ),
  ),
  'rope-freq-scale': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- RoPE频率缩放因子，通过因子1/N扩展上下文\n- RoPE frequency scaling factor, expands context by a factor of 1/N  (env: LLAMA_ARG_ROPE_FREQ_SCALE)',
    ),
  ),
  'yarn-orig-ctx': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- YaRN: 原始上下文大小（默认：0 = 模型训练上下文大小）\n- YaRN: original context size of model (default: 0 = model training context size)  (env: LLAMA_ARG_YARN_ORIG_CTX)',
    ),
  ),
  'yarn-ext-factor': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- YaRN: 插值混合因子（默认：-1.0，0.0 = 完全插值）\n- YaRN: extrapolation mix factor (default: -1.0, 0.0 = full interpolation)  (env: LLAMA_ARG_YARN_EXT_FACTOR)',
    ),
  ),
  'yarn-attn-factor': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- YaRN: 缩放 sqrt(t) 或注意力幅度（默认：-1.0）\n- YaRN: scale sqrt(t) or attention magnitude (default: -1.0)  (env: LLAMA_ARG_YARN_ATTN_FACTOR)',
    ),
  ),
  'yarn-beta-slow': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- YaRN: 高校正维度或alpha（默认：-1.0）\n- YaRN: high correction dim or alpha (default: -1.0)  (env: LLAMA_ARG_YARN_BETA_SLOW)',
    ),
  ),
  'yarn-beta-fast': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- YaRN: 低校正维或beta（默认：-1）\n- YaRN: low correction dim or beta (default: -1.0)  (env: LLAMA_ARG_YARN_BETA_FAST)',
    ),
  ),
  'no-kv-offload': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 禁用KV卸载\n- disable KV offload  (env: LLAMA_ARG_NO_KV_OFFLOAD)',
    ),
  ),
  'no-repack': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 禁用重量重新打包功能\n- disable weight repacking  (env: LLAMA_ARG_NO_REPACK)',
    ),
  ),
  'cache-type-k': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([
              v.picklist([
                'f32',
                'f16',
                'bf16',
                'q8_0',
                'q4_0',
                'q4_1',
                'iq4_nl',
                'q5_0',
                'q5_1',
              ]),
            ]),
          ),
        ),
      }),
    ),
    v.description(
      '- KV缓存数据类型用于K 允许的值: f32, f16, bf16, q8_0, q4_0, q4_1, iq4_nl, q5_0, q5_1 （默认: f16）\n- KV cache data type for K  allowed values: f32, f16, bf16, q8_0, q4_0, q4_1, iq4_nl, q5_0, q5_1  (default: f16)  (env: LLAMA_ARG_CACHE_TYPE_K)',
    ),
  ),
  'cache-type-v': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([
              v.picklist([
                'f32',
                'f16',
                'bf16',
                'q8_0',
                'q4_0',
                'q4_1',
                'iq4_nl',
                'q5_0',
                'q5_1',
              ]),
            ]),
          ),
        ),
      }),
    ),
    v.description(
      '- KV缓存数据类型用于V，允许的值：f32, f16, bf16, q8_0, q4_0, q4_1, iq4_nl, q5_0, q5_1（默认：f16）\n- KV cache data type for V  allowed values: f32, f16, bf16, q8_0, q4_0, q4_1, iq4_nl, q5_0, q5_1  (default: f16)  (env: LLAMA_ARG_CACHE_TYPE_V)',
    ),
  ),
  'defrag-thold': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- KV缓存碎片化阈值（默认：0.1，<0-禁用）\n- KV cache defragmentation threshold (DEPRECATED)  (env: LLAMA_ARG_DEFRAG_THOLD)',
    ),
  ),
  parallel: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 并行解码序列的数量（默认：1）\n- number of parallel sequences to decode (default: 1)  (env: LLAMA_ARG_N_PARALLEL)',
    ),
  ),
  mlock: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 强制系统将模型保留在RAM中而不是交换或压缩\n- force system to keep model in RAM rather than swapping or compressing  (env: LLAMA_ARG_MLOCK)',
    ),
  ),
  'no-mmap': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 不要内存映射模型（加载速度较慢，但可能减少页面丢失，如果未使用mlock）\n- do not memory-map model (slower load but may reduce pageouts if not using mlock)  (env: LLAMA_ARG_NO_MMAP)',
    ),
  ),
  numa: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([
              v.pipe(
                v.picklist(['distribute', 'isolate', 'numactl']),
                v.metadata({
                  enumOptions: [
                    {
                      label: 'distribute',
                      value: 'distribute',
                      description: '将执行均匀分布在所有节点上',
                    },
                    {
                      label: 'isolate',
                      value: 'isolate',
                      description: '仅在执行开始的节点的CPU上生成线程',
                    },
                    {
                      label: 'numactl',
                      value: 'numactl',
                      description: '使用numactl提供的CPU映射',
                    },
                  ],
                }),
              ),
            ]),
          ),
        ),
      }),
    ),
    v.description(
      '- 尝试在某些NUMA系统上进行优化 - distribute：将执行均匀分布在所有节点上 - isolate：仅在执行开始的节点的CPU上生成线程 - numactl：使用numactl提供的CPU映射 如果之前未运行过此操作，请在使用此功能前删除系统页面缓存 详见 https://github.com/ggml-org/llama.cpp/issues/1437\n- attempt optimizations that help on some NUMA systems  - distribute: spread execution evenly over all nodes  - isolate: only spawn threads on CPUs on the node that execution started on  - numactl: use the CPU map provided by numactl  if run without this previously, it is recommended to drop the system page cache before using this  see https://github.com/ggml-org/llama.cpp/issues/1437  (env: LLAMA_ARG_NUMA)',
    ),
  ),
  device: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([v.pipe(STR_SCHEMA, v.description('<dev1,dev2,..>'))]),
          ),
        ),
      }),
    ),
    v.description(
      "- 逗号分隔的设备列表，用于卸载（none = 不卸载）使用 --list-devices 查看可用设备列表\n- comma-separated list of devices to use for offloading (none = don't offload)  use --list-devices to see a list of available devices  (env: LLAMA_ARG_DEVICE)",
    ),
  ),
  'override-tensor': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([
              v.pipe(
                STR_SCHEMA,
                v.description('<tensor name pattern>=<buffer type>,...'),
              ),
            ]),
          ),
        ),
      }),
    ),
    v.description(
      '- 将所有专家组合（Mixture of Experts, MoE）的权重数据存储在 CPU 中。\n- override tensor buffer type',
    ),
  ),
  'cpu-moe': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 将前 N 层的“专家混合”（Expert Mixing, MoE）权重数据保留在 CPU 中。\n- keep all Mixture of Experts (MoE) weights in the CPU  (env: LLAMA_ARG_CPU_MOE)',
    ),
  ),
  'n-cpu-moe': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 覆盖张量缓冲区类型\n- keep the Mixture of Experts (MoE) weights of the first N layers in the CPU  (env: LLAMA_ARG_N_CPU_MOE)',
    ),
  ),
  'gpu-layers': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 存储在VRAM中的图层数量\n- max. number of layers to store in VRAM (default: -1)  (env: LLAMA_ARG_N_GPU_LAYERS)',
    ),
  ),
  'split-mode': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([
              v.pipe(
                v.picklist(['none', 'layer', 'row']),
                v.metadata({
                  enumOptions: [
                    {
                      label: 'none',
                      value: 'none',
                      description: '仅使用一个GPU',
                    },
                    {
                      label: 'layer',
                      value: 'layer',
                      description: '分割层和KV跨GPU',
                    },
                    { label: 'row', value: 'row', description: '分割行跨GPU' },
                  ],
                }),
              ),
            ]),
          ),
        ),
      }),
    ),
    v.description(
      '- 如何将模型分布在多个GPU上，可选：- none: 仅使用一个GPU - layer (默认): 分割层和KV跨GPU - row: 分割行跨GPU\n- how to split the model across multiple GPUs, one of:  - none: use one GPU only  - layer (default): split layers and KV across GPUs  - row: split rows across GPUs  (env: LLAMA_ARG_SPLIT_MODE)',
    ),
  ),
  'tensor-split': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([v.pipe(STR_SCHEMA, v.description('N0,N1,N2,...'))]),
          ),
        ),
      }),
    ),
    v.description(
      '- 将模型分片到每个GPU的分数，逗号分隔的比例列表，例如3,1\n- fraction of the model to offload to each GPU, comma-separated list of proportions, e.g. 3,1  (env: LLAMA_ARG_TENSOR_SPLIT)',
    ),
  ),
  'main-gpu': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('INDEX'))])),
        ),
      }),
    ),
    v.description(
      '- 用于模型（split-mode = none）或中间结果和KV（split-mode = row）的GPU（默认：0）\n- the GPU to use for the model (with split-mode = none), or for intermediate results and KV (with split-mode = row) (default: 0)  (env: LLAMA_ARG_MAIN_GPU)',
    ),
  ),
  'check-tensors': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 检查模型张量数据中的无效值（默认：false）\n- check model tensor data for invalid values (default: false)',
    ),
  ),
  'override-kv': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([v.pipe(STR_SCHEMA, v.description('KEY=TYPE:VALUE'))]),
          ),
        ),
      }),
    ),
    v.description(
      '- 用于通过键覆盖模型元数据的高级选项。可以多次指定。类型：int、float、bool、str。示例：--override-kv tokenizer.ggml.add_bos_token=bool:false\n- advanced option to override model metadata by key. may be specified multiple times.  types: int, float, bool, str. example: --override-kv tokenizer.ggml.add_bos_token=bool:false',
    ),
  ),
  'no-op-offload': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 禁用将主机张量操作卸载到设备（默认：false）\n- disable offloading host tensor operations to device (default: false)',
    ),
  ),
  lora: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FNAME'))])),
        ),
      }),
    ),
    v.description(
      '- LoRA适配器路径（可以重复使用多个适配器）\n- path to LoRA adapter (can be repeated to use multiple adapters)',
    ),
  ),
  'lora-scaled': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([
              v.pipe(STR_SCHEMA, v.description('FNAME')),
              v.pipe(v.number(), v.description('SCALE')),
            ]),
          ),
        ),
      }),
    ),
    v.description(
      '- LoRA适配器路径，带用户定义的缩放（可重复使用多个适配器）\n- path to LoRA adapter with user defined scaling (can be repeated to use multiple adapters)',
    ),
  ),
  'control-vector': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FNAME'))])),
        ),
      }),
    ),
    v.description(
      '- 添加控制向量  请注意：此参数可以重复以添加多个控制向量\n- add a control vector  note: this argument can be repeated to add multiple control vectors',
    ),
  ),
  'control-vector-scaled': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([
              v.pipe(STR_SCHEMA, v.description('FNAME')),
              v.pipe(v.number(), v.description('SCALE')),
            ]),
          ),
        ),
      }),
    ),
    v.description(
      '- 添加一个带用户定义缩放 SCALE 的控制向量  注意: 此参数可以重复以添加多个缩放的控制向量\n- add a control vector with user defined scaling SCALE  note: this argument can be repeated to add multiple scaled control vectors',
    ),
  ),
  'control-vector-layer-range': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([
              v.pipe(STR_SCHEMA, v.description('START')),
              v.pipe(STR_SCHEMA, v.description('END')),
            ]),
          ),
        ),
      }),
    ),
    v.description(
      '- 应用控制向量的图层范围，起始和结束值（包含）\n- layer range to apply the control vector(s) to, start and end inclusive',
    ),
  ),
  model: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FNAME'))])),
        ),
      }),
    ),
    v.description(
      '- 模型路径 (默认: `models/$filename` 与 `--hf-file` 或 `--model-url` 的文件名，否则 models/7B/ggml-model-f16.gguf)\n- model path (default: `models/$filename` with filename from `--hf-file` or `--model-url` if set, otherwise models/7B/ggml-model-f16.gguf)  (env: LLAMA_ARG_MODEL)',
    ),
  ),
  'model-url': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('MODEL_URL'))])),
        ),
      }),
    ),
    v.description(
      '- Docker Hub 模型仓库：该仓库是可选的，默认值为 `ai/`；`quant` 参数也是可选的，默认值为 `:latest`。例如：`gemma3`（默认值：未使用）。\n- model download url (default: unused)  (env: LLAMA_ARG_MODEL_URL)',
    ),
  ),
  'docker-repo': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.picklist(['<repo>/]<model>[:quant'])])),
        ),
      }),
    ),
    v.description(
      '- 模型下载地址（默认：未使用）\n- Docker Hub model repository. repo is optional, default to ai/. quant is optional, default to :latest.  example: gemma3  (default: unused)  (env: LLAMA_ARG_DOCKER_REPO)',
    ),
  ),
  'hf-repo': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([
              v.pipe(STR_SCHEMA, v.description('<user>/<model>[:quant]')),
            ]),
          ),
        ),
      }),
    ),
    v.description(
      "- Hugging Face 模型仓库; quant 是可选的，不区分大小写，默认为 Q4_K_M，如果不存在 Q4_K_M 则回退到仓库中的第一个文件。如果可用还会自动下载 mmproj。要禁用，添加 --no-mmproj  示例：unsloth/phi-4-GGUF:q4_k_m  （默认：未使用）\n- Hugging Face model repository; quant is optional, case-insensitive, default to Q4_K_M, or falls back to the first file in the repo if Q4_K_M doesn't exist.  mmproj is also downloaded automatically if available. to disable, add --no-mmproj  example: unsloth/phi-4-GGUF:q4_k_m  (default: unused)  (env: LLAMA_ARG_HF_REPO)",
    ),
  ),
  'hf-repo-draft': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([
              v.pipe(STR_SCHEMA, v.description('<user>/<model>[:quant]')),
            ]),
          ),
        ),
      }),
    ),
    v.description(
      '- 与--hf-repo相同，但用于草稿模型（默认：未使用）\n- Same as --hf-repo, but for the draft model (default: unused)  (env: LLAMA_ARG_HFD_REPO)',
    ),
  ),
  'hf-file': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FILE'))])),
        ),
      }),
    ),
    v.description(
      '- Hugging Face模型文件。如果指定了，将覆盖--hf-repo中的量化（默认：未使用）\n- Hugging Face model file. If specified, it will override the quant in --hf-repo (default: unused)  (env: LLAMA_ARG_HF_FILE)',
    ),
  ),
  'hf-repo-v': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([
              v.pipe(STR_SCHEMA, v.description('<user>/<model>[:quant]')),
            ]),
          ),
        ),
      }),
    ),
    v.description(
      '- Hugging Face vocoder模型仓库（默认：未使用）\n- Hugging Face model repository for the vocoder model (default: unused)  (env: LLAMA_ARG_HF_REPO_V)',
    ),
  ),
  'hf-file-v': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FILE'))])),
        ),
      }),
    ),
    v.description(
      '- Hugging Face模型文件用于声码器模型（默认：未使用）\n- Hugging Face model file for the vocoder model (default: unused)  (env: LLAMA_ARG_HF_FILE_V)',
    ),
  ),
  'hf-token': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('TOKEN'))])),
        ),
      }),
    ),
    v.description(
      '- Hugging Face访问令牌（默认：来自HF_TOKEN环境变量的值）\n- Hugging Face access token (default: value from HF_TOKEN environment variable)  (env: HF_TOKEN)',
    ),
  ),
  'log-disable': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description('- 日志禁用\n- Log disable'),
  ),
  'log-file': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FNAME'))])),
        ),
      }),
    ),
    v.description('- 日志记录到文件\n- Log to file'),
  ),
  'log-colors': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(v.optional(v.tuple([v.picklist(['on', 'off', 'auto'])]))),
      }),
    ),
    v.description(
      "- 启用彩色日志记录\n- Set colored logging ('on', 'off', or 'auto', default: 'auto')  'auto' enables colors when output is to a terminal  (env: LLAMA_LOG_COLORS)",
    ),
  ),
  verbose: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 设置 verbosity 级别为无穷大（即记录所有消息，用于调试）\n- Set verbosity level to infinity (i.e. log all messages, useful for debugging)',
    ),
  ),
  offline: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 离线模式：强制使用缓存，阻止网络访问\n- Offline mode: forces use of cache, prevents network access  (env: LLAMA_OFFLINE)',
    ),
  ),
  verbosity: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 设置日志的详细程度阈值。消息的详细程度越高，将被忽略。\n- Set the verbosity threshold. Messages with a higher verbosity will be ignored.  (env: LLAMA_LOG_VERBOSITY)',
    ),
  ),
  'log-prefix': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 启用日志消息中的前缀\n- Enable prefix in log messages  (env: LLAMA_LOG_PREFIX)',
    ),
  ),
  'log-timestamps': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 启用日志消息中的时间戳\n- Enable timestamps in log messages  (env: LLAMA_LOG_TIMESTAMPS)',
    ),
  ),
  'cache-type-k-draft': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('TYPE'))])),
        ),
      }),
    ),
    v.description(
      '- KV缓存中用于草稿模型的K的数据类型，允许的值包括：f32、f16、bf16、q8_0、q4_0、q4_1、iq4_nl、q5_0、q5_1（默认值：f16）\n- KV cache data type for K for the draft model  allowed values: f32, f16, bf16, q8_0, q4_0, q4_1, iq4_nl, q5_0, q5_1  (default: f16)  (env: LLAMA_ARG_CACHE_TYPE_K_DRAFT)',
    ),
  ),
  'cache-type-v-draft': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('TYPE'))])),
        ),
      }),
    ),
    v.description(
      '- KV缓存中用于草稿模型的V的数据类型，允许的值包括：f32、f16、bf16、q8_0、q4_0、q4_1、iq4_nl、q5_0、q5_1（默认值：f16）\n- KV cache data type for V for the draft model  allowed values: f32, f16, bf16, q8_0, q4_0, q4_1, iq4_nl, q5_0, q5_1  (default: f16)  (env: LLAMA_ARG_CACHE_TYPE_V_DRAFT)',
    ),
  ),
});
