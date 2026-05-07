import * as v from 'valibot';
const STR_SCHEMA = v.pipe(v.string(), v.trim());
export const SamplingDefine = v.object({
  samplers: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('SAMPLERS'))])),
        ),
      }),
    ),
    v.description(
      "- samplers that will be used for generation in the order, separated by ';'  (default: penalties;dry;top_n_sigma;top_k;typ_p;top_p;min_p;xtc;temperature)\n- samplers that will be used for generation in the order, separated by ';'  (default: penalties;dry;top_n_sigma;top_k;typ_p;top_p;min_p;xtc;temperature)",
    ),
  ),
  seed: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('SEED'))])),
        ),
      }),
    ),
    v.description(
      '- RNG种子（默认：-1，使用随机种子）\n- RNG seed (default: -1, use random seed for -1)',
    ),
  ),
  'sampling-seq': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('SEQUENCE'))])),
        ),
      }),
    ),
    v.description(
      '- 简化的采样序列，用于采样器（默认：edskypmxt）\n- simplified sequence for samplers that will be used (default: edskypmxt)',
    ),
  ),
  'ignore-eos': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 忽略流结束标记并继续生成（隐含--logit-bias EOS-inf）\n- ignore end of stream token and continue generating (implies --logit-bias EOS-inf)',
    ),
  ),
  temp: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description('- temperature (default: 0.8)\n- temperature (default: 0.8)'),
  ),
  'top-k': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- top-k 采样 (默认: 40, 0 = 禁用)\n- top-k sampling (default: 40, 0 = disabled)',
    ),
  ),
  'top-p': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- top-p 采样（默认：0.9，1.0 = 禁用）\n- top-p sampling (default: 0.9, 1.0 = disabled)',
    ),
  ),
  'min-p': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- min-p 采样 (默认: 0.1, 0.0 = 禁用)\n- min-p sampling (default: 0.1, 0.0 = disabled)',
    ),
  ),
  'top-nsigma': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- Top-N-Sigma抽样方法（默认值：-1.0；当两个参数都为-1.0时，该方法被禁用）\n- top-n-sigma sampling (default: -1.0, -1.0 = disabled)',
    ),
  ),
  'xtc-probability': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- xtc probability (默认: 0.0, 0.0 = 禁用)\n- xtc probability (default: 0.0, 0.0 = disabled)',
    ),
  ),
  'xtc-threshold': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- xtc threshold (默认: 0.1, 1.0 = 禁用)\n- xtc threshold (default: 0.1, 1.0 = disabled)',
    ),
  ),
  typical: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 局部典型抽样，参数 p（默认：1.0，1.0 = 禁用）\n- locally typical sampling, parameter p (default: 1.0, 1.0 = disabled)',
    ),
  ),
  'repeat-last-n': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 用于惩罚的最后n个token（默认：64，0 = 禁用，-1 = 上下文大小）\n- last n tokens to consider for penalize (default: 64, 0 = disabled, -1 = ctx_size)',
    ),
  ),
  'repeat-penalty': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 惩罚重复的token序列（默认：1.0，1.0 = 禁用）\n- penalize repeat sequence of tokens (default: 1.0, 1.0 = disabled)',
    ),
  ),
  'presence-penalty': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 重复 alpha 存在惩罚（默认：0.0，0.0 = 禁用）\n- repeat alpha presence penalty (default: 0.0, 0.0 = disabled)',
    ),
  ),
  'frequency-penalty': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 重复 alpha 频率惩罚（默认：0.0，0.0 = 禁用）\n- repeat alpha frequency penalty (default: 0.0, 0.0 = disabled)',
    ),
  ),
  'dry-multiplier': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 设置 DRY 采样乘数（默认：0.0，0.0 = 禁用）\n- set DRY sampling multiplier (default: 0.0, 0.0 = disabled)',
    ),
  ),
  'dry-base': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 设置 DRY 采样基础值 (默认: 1.75)\n- set DRY sampling base value (default: 1.75)',
    ),
  ),
  'dry-allowed-length': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 设置DRY采样的允许长度（默认：2）\n- set allowed length for DRY sampling (default: 2)',
    ),
  ),
  'dry-penalty-last-n': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 设置最后n个token的DRY惩罚（默认：-1，0 = 禁用，-1 = 上下文大小）\n- set DRY penalty for the last n tokens (default: -1, 0 = disable, -1 = context size)',
    ),
  ),
  'dry-sequence-breaker': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('STRING'))])),
        ),
      }),
    ),
    v.description(
      "- 添加序列破环器用于DRY抽样，清除默认的破环器（'\\n', ':', '\"', '*'）；使用 \"none\" 不使用任何序列破环器\n- add sequence breaker for DRY sampling, clearing out default breakers ('\\n', ':', '\"', '*') in the process; use \"none\" to not use any sequence breakers",
    ),
  ),
  'dynatemp-range': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 动态温度范围 (默认: 0.0, 0.0 = 禁用)\n- dynamic temperature range (default: 0.0, 0.0 = disabled)',
    ),
  ),
  'dynatemp-exp': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 动态温度指数（默认：1.0）\n- dynamic temperature exponent (default: 1.0)',
    ),
  ),
  mirostat: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 使用Mirostat抽样。如果使用了Top K、Nucleus和Locally Typical抽样器，则会被忽略。（默认：0，0=禁用，1=Mirostat，2=Mirostat 2.0）\n- use Mirostat sampling.  Top K, Nucleus and Locally Typical samplers are ignored if used.  (default: 0, 0 = disabled, 1 = Mirostat, 2 = Mirostat 2.0)',
    ),
  ),
  'mirostat-lr': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- Mirostat学习率，参数eta（默认：0.1）\n- Mirostat learning rate, parameter eta (default: 0.1)',
    ),
  ),
  'mirostat-ent': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- Mirostat目标熵，参数tau（默认：5.0）\n- Mirostat target entropy, parameter tau (default: 5.0)',
    ),
  ),
  'logit-bias': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([v.pipe(STR_SCHEMA, v.description('TOKEN_ID(+/-)BIAS'))]),
          ),
        ),
      }),
    ),
    v.description(
      "- 修改标记出现在完成中的可能性，例如：--logit-bias 15043+1 增加标记 ' Hello' 的可能性，或 --logit 15043-1 减少标记 ' Hello' 的可能性\n- modifies the likelihood of token appearing in the completion,  i.e. `--logit-bias 15043+1` to increase likelihood of token ' Hello',  or `--logit-bias 15043-1` to decrease likelihood of token ' Hello'",
    ),
  ),
  grammar: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('GRAMMAR'))])),
        ),
      }),
    ),
    v.description(
      "- BNF类似语法约束生成（参见grammars目录中的示例）（默认：''）\n- BNF-like grammar to constrain generations (see samples in grammars/ dir) (default: '')",
    ),
  ),
  'grammar-file': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FNAME'))])),
        ),
      }),
    ),
    v.description('- 从文件读取语法\n- file to read grammar from'),
  ),
  'json-schema': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('SCHEMA'))])),
        ),
      }),
    ),
    v.description(
      '- JSON schema 用于约束生成（https://json-schema.org/），例如 `{}` 表示任何 JSON 对象。对于包含外部 $refs 的 schema，使用 --grammar + example/json_schema_to_grammar.py 代替\n- JSON schema to constrain generations (https://json-schema.org/), e.g. `{}` for any JSON object  For schemas w/ external $refs, use --grammar + example/json_schema_to_grammar.py instead',
    ),
  ),
  'json-schema-file': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FILE'))])),
        ),
      }),
    ),
    v.description(
      '- 包含用于约束生成的JSON架构的文件（https://json-schema.org/），例如{}表示任何JSON对象  对于具有外部$refs的架构，使用--grammar + example/json_schema_to_grammar.py代替\n- File containing a JSON schema to constrain generations (https://json-schema.org/), e.g. `{}` for any JSON object  For schemas w/ external $refs, use --grammar + example/json_schema_to_grammar.py instead',
    ),
  ),
});
