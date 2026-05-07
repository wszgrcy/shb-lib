import * as v from 'valibot';
const STR_SCHEMA = v.pipe(v.string(), v.trim());
export const ExampleSpecificDefine = v.object({
  'swa-checkpoints': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 每个时间槽内可创建的 SWA 检查点最大数量（默认值：3）：[更多信息](https://github.com/ggml-org/llama.cpp/pull/15293)\n- max number of SWA checkpoints per slot to create (default: 3)  [(more info)](https://github.com/ggml-org/llama.cpp/pull/15293)  (env: LLAMA_ARG_SWA_CHECKPOINTS)',
    ),
  ),
  'no-context-shift': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 禁用无限文本生成中的上下文转换（默认：禁用）\n- disables context shift on infinite text generation (default: enabled)  (env: LLAMA_ARG_NO_CONTEXT_SHIFT)',
    ),
  ),
  'context-shift': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 该功能允许在无限文本生成过程中实现上下文切换（默认设置为禁用状态）。\n- enables context shift on infinite text generation (default: disabled)  (env: LLAMA_ARG_CONTEXT_SHIFT)',
    ),
  ),
  'reverse-prompt': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('PROMPT'))])),
        ),
      }),
    ),
    v.description(
      '- 在 PROMPT 状态下停止程序的执行，然后以交互模式恢复程序的控制权。\n- halt generation at PROMPT, return control in interactive mode',
    ),
  ),
  special: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 特殊标记输出启用（默认：false）\n- special tokens output enabled (default: false)',
    ),
  ),
  'no-warmup': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- skip warming up the model with an empty run\n- skip warming up the model with an empty run',
    ),
  ),
  'spm-infill': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用后缀/前缀/中间模式进行填充（代替前缀/后缀/中间）\n- use Suffix/Prefix/Middle pattern for infill (instead of Prefix/Suffix/Middle) as some models prefer this. (default: disabled)',
    ),
  ),
  pooling: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([v.picklist(['none', 'mean', 'cls', 'last', 'rank'])]),
          ),
        ),
      }),
    ),
    v.description(
      '- 嵌入的池化类型，如果未指定则使用模型默认值\n- pooling type for embeddings, use model default if unspecified  (env: LLAMA_ARG_POOLING)',
    ),
  ),
  'cont-batching': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 启用连续批处理（又名动态批处理）（默认：启用）\n- enable continuous batching (a.k.a dynamic batching) (default: enabled)  (env: LLAMA_ARG_CONT_BATCHING)',
    ),
  ),
  'no-cont-batching': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- disable continuous batching\n- disable continuous batching  (env: LLAMA_ARG_NO_CONT_BATCHING)',
    ),
  ),
  mmproj: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FILE'))])),
        ),
      }),
    ),
    v.description(
      '- 多模态投影文件路径。参见tools/mtmd/README.md 说明：如果使用-hf参数，可以省略此参数\n- path to a multimodal projector file. see tools/mtmd/README.md  note: if -hf is used, this argument can be omitted  (env: LLAMA_ARG_MMPROJ)',
    ),
  ),
  'mmproj-url': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('URL'))])),
        ),
      }),
    ),
    v.description(
      '- 多模态投影文件的URL。参见tools/mtmd/README.md\n- URL to a multimodal projector file. see tools/mtmd/README.md  (env: LLAMA_ARG_MMPROJ_URL)',
    ),
  ),
  'no-mmproj': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 显式禁用多模态投影器，适用于使用 -hf 时\n- explicitly disable multimodal projector, useful when using -hf  (env: LLAMA_ARG_NO_MMPROJ)',
    ),
  ),
  'no-mmproj-offload': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 不要将多模态投影器卸载到GPU\n- do not offload multimodal projector to GPU  (env: LLAMA_ARG_NO_MMPROJ_OFFLOAD)',
    ),
  ),
  'override-tensor-draft': v.pipe(
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
      '- 为草图模型覆盖张量缓冲区的类型\n- override tensor buffer type for draft model',
    ),
  ),
  'cpu-moe-draft': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 将所有专家组合（Mixture of Experts, MoE）的权重都存储在 CPU 中，以便用于模型的训练过程。\n- keep all Mixture of Experts (MoE) weights in the CPU for the draft model  (env: LLAMA_ARG_CPU_MOE_DRAFT)',
    ),
  ),
  'n-cpu-moe-draft': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 将前 N 层的专家组合（Expert Combination, MoE）权重存储在 CPU 中，以用于初步模型的训练。\n- keep the Mixture of Experts (MoE) weights of the first N layers in the CPU for the draft model  (env: LLAMA_ARG_N_CPU_MOE_DRAFT)',
    ),
  ),
  alias: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('STRING'))])),
        ),
      }),
    ),
    v.description(
      '- 设置模型名称的别名（用于REST API）\n- set alias for model name (to be used by REST API)  (env: LLAMA_ARG_ALIAS)',
    ),
  ),
  host: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('HOST'))])),
        ),
      }),
    ),
    v.description(
      '- 监听的IP地址，或以.sock结尾的UNIX套接字路径（默认：127.0.0.1）\n- ip address to listen, or bind to an UNIX socket if the address ends with .sock (default: 127.0.0.1)  (env: LLAMA_ARG_HOST)',
    ),
  ),
  port: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('PORT'))])),
        ),
      }),
    ),
    v.description(
      '- 端口监听 (默认: 8080)\n- port to listen (default: 8080)  (env: LLAMA_ARG_PORT)',
    ),
  ),
  path: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('PATH'))])),
        ),
      }),
    ),
    v.description(
      '- 路径以供静态文件服务（默认：）\n- path to serve static files from (default: )  (env: LLAMA_ARG_STATIC_PATH)',
    ),
  ),
  'api-prefix': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('PREFIX'))])),
        ),
      }),
    ),
    v.description(
      '- 服务器提供服务的路径前缀（不包括末尾的斜杠，默认:）。\n- prefix path the server serves from, without the trailing slash (default: )  (env: LLAMA_ARG_API_PREFIX)',
    ),
  ),
  'no-webui': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 禁用Web UI（默认：启用）\n- Disable the Web UI (default: enabled)  (env: LLAMA_ARG_NO_WEBUI)',
    ),
  ),
  embedding: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 限制仅支持嵌入用例; 仅与专用嵌入模型一起使用 (默认: 禁用)\n- restrict to only support embedding use case; use only with dedicated embedding models (default: disabled)  (env: LLAMA_ARG_EMBEDDINGS)',
    ),
  ),
  reranking: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 启用服务器上的重排序端点（默认：禁用）\n- enable reranking endpoint on server (default: disabled)  (env: LLAMA_ARG_RERANKING)',
    ),
  ),
  'api-key': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('KEY'))])),
        ),
      }),
    ),
    v.description(
      '- API key to use for authentication (default: none)\n- API key to use for authentication (default: none)  (env: LLAMA_API_KEY)',
    ),
  ),
  'api-key-file': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FNAME'))])),
        ),
      }),
    ),
    v.description(
      '- 包含API密钥的文件路径（默认：无）\n- path to file containing API keys (default: none)',
    ),
  ),
  'ssl-key-file': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FNAME'))])),
        ),
      }),
    ),
    v.description(
      '- PEM编码SSL私钥文件的路径\n- path to file a PEM-encoded SSL private key  (env: LLAMA_ARG_SSL_KEY_FILE)',
    ),
  ),
  'ssl-cert-file': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FNAME'))])),
        ),
      }),
    ),
    v.description(
      '- PEM编码SSL证书文件路径\n- path to file a PEM-encoded SSL certificate  (env: LLAMA_ARG_SSL_CERT_FILE)',
    ),
  ),
  'chat-template-kwargs': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('STRING'))])),
        ),
      }),
    ),
    v.description(
      '- 为 JSON 模板解析器设置额外的参数\n- sets additional params for the json template parser  (env: LLAMA_CHAT_TEMPLATE_KWARGS)',
    ),
  ),
  timeout: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 服务器读/写超时时间（秒），默认：600\n- server read/write timeout in seconds (default: 600)  (env: LLAMA_ARG_TIMEOUT)',
    ),
  ),
  'threads-http': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 用于处理HTTP请求的线程数（默认：-1）\n- number of threads used to process HTTP requests (default: -1)  (env: LLAMA_ARG_THREADS_HTTP)',
    ),
  ),
  'cache-reuse': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 最小块大小以尝试通过KV移动从缓存中重用 (默认: 0) [(card)](https://ggml.ai/f0.png)\n- min chunk size to attempt reusing from the cache via KV shifting (default: 0)  [(card)](https://ggml.ai/f0.png)  (env: LLAMA_ARG_CACHE_REUSE)',
    ),
  ),
  metrics: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 启用 prometheus 兼容的 metrics 端点 (默认: 禁用)\n- enable prometheus compatible metrics endpoint (default: disabled)  (env: LLAMA_ARG_ENDPOINT_METRICS)',
    ),
  ),
  props: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 启用通过POST /props更改全局属性（默认：禁用）\n- enable changing global properties via POST /props (default: disabled)  (env: LLAMA_ARG_ENDPOINT_PROPS)',
    ),
  ),
  slots: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 启用插槽监控端点（默认：禁用）\n- enable slots monitoring endpoint (default: enabled)  (env: LLAMA_ARG_ENDPOINT_SLOTS)',
    ),
  ),
  'no-slots': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 禁用插槽监控端点\n- disables slots monitoring endpoint  (env: LLAMA_ARG_NO_ENDPOINT_SLOTS)',
    ),
  ),
  'slot-save-path': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('PATH'))])),
        ),
      }),
    ),
    v.description(
      '- 保存slot kv缓存的路径（默认：禁用）\n- path to save slot kv cache (default: disabled)',
    ),
  ),
  jinja: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用jinja模板进行聊天（默认：禁用）\n- use jinja template for chat (default: disabled)  (env: LLAMA_ARG_JINJA)',
    ),
  ),
  'reasoning-format': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(v.optional(v.tuple([v.picklist(['deepseek', 'none'])]))),
      }),
    ),
    v.description(
      "- 控制是否允许并/或从响应中提取思维标签，以及以何种格式返回；可选值包括：  \\n- none：将思维内容原样保留在 `message.content` 中  \\n- deepseek：将思维内容放入 `message.reasoning_content`（在流式模式下行为与 none 相同）  \\n（默认值：deepseek）\n- controls whether thought tags are allowed and/or extracted from the response, and in which format they're returned; one of:  - none: leaves thoughts unparsed in `message.content`  - deepseek: puts thoughts in `message.reasoning_content` (except in streaming mode, which behaves as `none`)  (default: auto)  (env: LLAMA_ARG_THINK)",
    ),
  ),
  'reasoning-budget': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 控制允许的思考量；目前只能选择以下选项之一：-1 表示无限制的思考预算，或 0 表示禁用思考（默认值：-1）\n- controls the amount of thinking allowed; currently only one of: -1 for unrestricted thinking budget, or 0 to disable thinking (default: -1)  (env: LLAMA_ARG_THINK_BUDGET)',
    ),
  ),
  'chat-template': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([v.pipe(STR_SCHEMA, v.description('JINJA_TEMPLATE'))]),
          ),
        ),
      }),
    ),
    v.description(
      "- 设置自定义的Jinja聊天模板（默认：从模型元数据中获取模板）如果指定了后缀/前缀，模板将被禁用 仅接受常用模板（除非在该标志之前设置了--jinja）：内置模板列表：bailing, chatglm3, chatglm4, chatml, command-r, deepseek, deepseek2, deepseek3, exaone3, falcon3, gemma, gigachat, glmedge, granite, llama2, llama2-sys, llama2-sys-bos, llama2-sys-strip, llama3, llama4, megrez, minicpm, mistral-v1, mistral-v3, mistral-v3-tekken, mistral-v7, mistral-v7-0, mistral-v7-tekken, monarch, openchat, orion, phi3, phi4, rwkv-world, smolvlm, vicuna, vicuna-orca, yandex, zephyr\n- set custom jinja chat template (default: template taken from model's metadata)  if suffix/prefix are specified, template will be disabled  only commonly used templates are accepted (unless --jinja is set before this flag):  list of built-in templates:  bailing, chatglm3, chatglm4, chatml, command-r, deepseek, deepseek2, deepseek3, exaone3, exaone4, falcon3, gemma, gigachat, glmedge, gpt-oss, granite, grok-2, hunyuan-dense, hunyuan-moe, kimi-k2, llama2, llama2-sys, llama2-sys-bos, llama2-sys-strip, llama3, llama4, megrez, minicpm, mistral-v1, mistral-v3, mistral-v3-tekken, mistral-v7, mistral-v7-tekken, monarch, openchat, orion, phi3, phi4, rwkv-world, seed_oss, smolvlm, vicuna, vicuna-orca, yandex, zephyr  (env: LLAMA_ARG_CHAT_TEMPLATE)",
    ),
  ),
  'chat-template-file': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([v.pipe(STR_SCHEMA, v.description('JINJA_TEMPLATE_FILE'))]),
          ),
        ),
      }),
    ),
    v.description(
      "- 设置自定义的Jinja聊天模板文件（默认：从模型元数据中获取模板）如果指定了后缀/前缀，模板将被禁用 仅接受常用模板（除非在该标志之前设置了--jinja）：内置模板列表：bailing, chatglm3, chatglm4, chatml, command-r, deepseek, deepseek2, deepseek3, exaone3, falcon3, gemma, gigachat, glmedge, granite, llama2, llama2-sys, llama2-sys-bos, llama2-sys-strip, llama3, llama4, megrez, minicpm, mistral-v1, mistral-v3, mistral-v3-tekken, mistral-v7, mistral-v7-0, mistral-v7-tekken, monarch, openchat, orion, phi3, phi4, rwkv-world, smolvlm, vicuna, vicuna-orca, yandex, zephyr\n- set custom jinja chat template file (default: template taken from model's metadata)  if suffix/prefix are specified, template will be disabled  only commonly used templates are accepted (unless --jinja is set before this flag):  list of built-in templates:  bailing, chatglm3, chatglm4, chatml, command-r, deepseek, deepseek2, deepseek3, exaone3, exaone4, falcon3, gemma, gigachat, glmedge, gpt-oss, granite, grok-2, hunyuan-dense, hunyuan-moe, kimi-k2, llama2, llama2-sys, llama2-sys-bos, llama2-sys-strip, llama3, llama4, megrez, minicpm, mistral-v1, mistral-v3, mistral-v3-tekken, mistral-v7, mistral-v7-tekken, monarch, openchat, orion, phi3, phi4, rwkv-world, seed_oss, smolvlm, vicuna, vicuna-orca, yandex, zephyr  (env: LLAMA_ARG_CHAT_TEMPLATE_FILE)",
    ),
  ),
  'no-prefill-assistant': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      "- 是否在最后一条消息是助手消息时预填充助手的响应（默认：预填充启用）当设置此标志时，如果最后一条消息是助手消息，则将其视为完整消息且不预填充\n- whether to prefill the assistant's response if the last message is an assistant message (default: prefill enabled)  when this flag is set, if the last message is an assistant message then it will be treated as a full message and not prefilled    (env: LLAMA_ARG_NO_PREFILL_ASSISTANT)",
    ),
  ),
  'slot-prompt-similarity': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([v.pipe(STR_SCHEMA, v.description('SIMILARITY'))]),
          ),
        ),
      }),
    ),
    v.description(
      '- 提示必须与槽的提示匹配多少才能使用该槽（默认：0.50，0.0 = 禁用）\n- how much the prompt of a request must match the prompt of a slot in order to use that slot (default: 0.10, 0.0 = disabled)',
    ),
  ),
  'lora-init-without-apply': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 加载LoRA适配器而不应用它们（稍后通过POST /lora-adapters应用）（默认：禁用）\n- load LoRA adapters without applying them (apply later via POST /lora-adapters) (default: disabled)',
    ),
  ),
  'threads-draft': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 在生成过程中使用的线程数量（默认值：与 --threads 的值相同）\n- number of threads to use during generation (default: same as --threads)',
    ),
  ),
  'threads-batch-draft': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 在批量处理和即时处理过程中使用的线程数量（默认值：与 --threads-draft 的值相同）\n- number of threads to use during batch and prompt processing (default: same as --threads-draft)',
    ),
  ),
  'draft-max': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 用于推测解码的草稿令牌数量（默认：16）\n- number of tokens to draft for speculative decoding (default: 16)  (env: LLAMA_ARG_DRAFT_MAX)',
    ),
  ),
  'draft-min': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 最小的草稿标记数，用于推测解码（默认：0）\n- minimum number of draft tokens to use for speculative decoding (default: 0)  (env: LLAMA_ARG_DRAFT_MIN)',
    ),
  ),
  'draft-p-min': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('P'))])),
        ),
      }),
    ),
    v.description(
      '- 最小推测解码概率（贪心）（默认：0.8）\n- minimum speculative decoding probability (greedy) (default: 0.8)  (env: LLAMA_ARG_DRAFT_P_MIN)',
    ),
  ),
  'ctx-size-draft': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 提示上下文的大小用于草稿模型（默认：0，0 = 从模型加载）\n- size of the prompt context for the draft model (default: 0, 0 = loaded from model)  (env: LLAMA_ARG_CTX_SIZE_DRAFT)',
    ),
  ),
  'device-draft': v.pipe(
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
      "- 逗号分隔的设备列表，用于卸载草稿模型（none = 不卸载）使用--list-devices查看可用设备列表\n- comma-separated list of devices to use for offloading the draft model (none = don't offload)  use --list-devices to see a list of available devices",
    ),
  ),
  'gpu-layers-draft': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(v.number(), v.description('N'))])),
        ),
      }),
    ),
    v.description(
      '- 存储在VRAM中的图层数量用于草稿模型\n- number of layers to store in VRAM for the draft model  (env: LLAMA_ARG_N_GPU_LAYERS_DRAFT)',
    ),
  ),
  'model-draft': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FNAME'))])),
        ),
      }),
    ),
    v.description(
      '- 用于推测解码的草稿模型（默认：未使用）\n- draft model for speculative decoding (default: unused)  (env: LLAMA_ARG_MODEL_DRAFT)',
    ),
  ),
  'spec-replace': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(
            v.tuple([
              v.pipe(STR_SCHEMA, v.description('TARGET')),
              v.pipe(STR_SCHEMA, v.description('DRAFT')),
            ]),
          ),
        ),
      }),
    ),
    v.description(
      '- 如果草稿模型（Draft Model）与主模型（Main Model）不兼容，那么需要将目标字符串（Target String）转换为草稿格式（Draft Format）。\n- translate the string in TARGET into DRAFT if the draft model and main model are not compatible',
    ),
  ),
  'model-vocoder': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        value: v.pipe(
          v.optional(v.tuple([v.pipe(STR_SCHEMA, v.description('FNAME'))])),
        ),
      }),
    ),
    v.description(
      '- 语音合成模型用于音频生成（默认：未使用）\n- vocoder model for audio generation (default: unused)',
    ),
  ),
  'tts-use-guide-tokens': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用引导标记以提高TTS单词回忆\n- Use guide tokens to improve TTS word recall',
    ),
  ),
  'embd-bge-small-en-default': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用默认的bge-small-en-v1.5模型（注意：可以从互联网下载权重）\n- use default bge-small-en-v1.5 model (note: can download weights from the internet)',
    ),
  ),
  'embd-e5-small-en-default': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用默认的e5-small-v2模型（注意：可以从互联网下载权重）\n- use default e5-small-v2 model (note: can download weights from the internet)',
    ),
  ),
  'embd-gte-small-default': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用默认的gte-small模型（注意：可以从互联网下载权重）\n- use default gte-small model (note: can download weights from the internet)',
    ),
  ),
  'fim-qwen-1.5b-default': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用默认的Qwen 2.5 Coder 1.5B\n- use default Qwen 2.5 Coder 1.5B (note: can download weights from the internet)',
    ),
  ),
  'fim-qwen-3b-default': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用默认的Qwen 2.5 Coder 3B（注意：可以从互联网下载权重）\n- use default Qwen 2.5 Coder 3B (note: can download weights from the internet)',
    ),
  ),
  'fim-qwen-7b-default': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用默认的Qwen 2.5 Coder 7B（注意：可以从互联网下载权重）\n- use default Qwen 2.5 Coder 7B (note: can download weights from the internet)',
    ),
  ),
  'fim-qwen-7b-spec': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用Qwen 2.5 Coder 7B + 0.5B draft进行推测解码（注意：可以从互联网下载权重）\n- use Qwen 2.5 Coder 7B + 0.5B draft for speculative decoding (note: can download weights from the internet)',
    ),
  ),
  'fim-qwen-14b-spec': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用Qwen 2.5 Coder 14B + 0.5B draft进行推测解码（注意：可以从互联网下载权重）\n- use Qwen 2.5 Coder 14B + 0.5B draft for speculative decoding (note: can download weights from the internet)',
    ),
  ),
  'fim-qwen-30b-default': v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
      }),
    ),
    v.description(
      '- 使用默认的 Qwen 3 Coder 30B A3B Instruct；请注意：可以从互联网上下载相应的权重数据。\n- use default Qwen 3 Coder 30B A3B Instruct (note: can download weights from the internet)',
    ),
  ),
});
