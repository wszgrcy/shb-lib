import {
  asControl,
  actions,
  setComponent,
} from '@piying/view-angular-core';
import * as v from 'valibot';
import {
  asVirtualGroup,
  metadataPipe,
  omitIntersect,
} from '@piying/valibot-visit';
const VendorList = [
  {
    value: 'openai',
    label: 'openai',
    options: {
      baseURL: '',
      modelList: [],
      description: '如果是openai兼容的厂商,需要设置baseURL',
    },
  },
  {
    value: '360',
    label: '360',
    options: { baseURL: 'https://ai.360.cn', modelList: [] },
  },
  {
    value: 'azure',
    label: 'azure',
    options: { baseURL: '', modelList: [] },
  },
  {
    value: 'moonshot',
    label: 'moonshot',
    options: { baseURL: 'https://api.moonshot.cn', modelList: [] },
  },
  {
    value: 'baichuan',
    label: 'baichuan',
    options: { baseURL: 'https://api.baichuan-ai.com', modelList: [] },
  },
  {
    value: 'minimax',
    label: 'minimax',
    options: { baseURL: 'https://api.minimax.chat', modelList: [] },
  },
  {
    value: 'mistralai',
    label: 'mistralai',
    options: { baseURL: 'https://api.mistral.ai', modelList: [] },
  },
  {
    value: 'groq',
    label: 'groq',
    options: { baseURL: 'https://api.groq.com/openai', modelList: [] },
  },
  {
    value: 'lingyiwanwu',
    label: 'lingyiwanwu',
    options: { baseURL: 'https://api.lingyiwanwu.com', modelList: [] },
  },
  {
    value: 'stepfun',
    label: 'stepfun',
    options: { baseURL: 'https://api.stepfun.com', modelList: [] },
  },
  {
    value: 'deepseek',
    label: 'deepseek',
    options: { baseURL: 'https://api.deepseek.com', modelList: [] },
  },
  {
    value: 'together.ai',
    label: 'together.ai',
    options: { baseURL: 'https://api.together.xyz', modelList: [] },
  },
  {
    value: 'volcengine',
    label: 'volcengine',
    options: {
      baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
      modelList: [],
    },
  },
  {
    value: 'novita',
    label: 'novita',
    options: { baseURL: 'https://api.novita.ai/v3/openai', modelList: [] },
  },
  {
    value: 'siliconflow',
    label: 'siliconflow',
    options: { baseURL: 'https://api.siliconflow.cn', modelList: [] },
  },
  {
    value: 'tongyi',
    label: 'tongyi',
    options: {
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      modelList: [],
    },
  },
  {
    value: 'zhipu',
    label: 'zhipu',
    options: {
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      modelList: [],
    },
  },
  {
    value: 'spark',
    label: 'spark',
    options: {
      baseURL: 'https://spark-api-open.xf-yun.com/v1',
      modelList: [],
    },
  },
  {
    value: 'hunyuan',
    label: 'hunyuan',
    options: {
      baseURL: 'https://api.hunyuan.cloud.tencent.com/v1',
      modelList: [],
    },
  },

  {
    value: 'gemini',
    label: 'gemini',
    options: {
      baseURL: '',
      modelList: [],
      description: '非openai兼容,手动适配,如果有问题欢迎报告',
    },
  },
  {
    value: 'claude',
    label: 'claude',
    options: {
      baseURL: '',
      modelList: [],
      description: '非openai兼容,手动适配,如果有问题欢迎报告',
    },
  },
] as const;
const vendorOptionsDescribe = `## 通用参数
- \`extraOptions\`字段用于覆盖默认字段
\`\`\`json
{"厂商名(与vendor字段相同)":{ "extraOptions":{"temperature":0.1,"topP":0.8,"maxTokens":8192,"baseURL":"http://127.0.0.1:11434/v1","apiKey":" "} }
\`\`\`
`;
const InputWrapper = metadataPipe(actions.wrappers.set(['tooltip', 'label']));

export const ChatItemDefine = v.pipe(
  v.intersect([
    v.pipe(
      v.object({
        name: v.pipe(v.string(), v.title('配置名')),
        vendor: v.pipe(
          v.optional(
            v.picklist(VendorList.map((item) => item.value)),
            'openai',
          ),
          v.description('大语言模型提供的厂商'),
          v.title('对话厂商'),
          v.metadata({
            enumOptions: VendorList.map((item) => ({
              label: item.label,
              description: [
                (item.options as any).description
                  ? (item.options as any).description
                  : '',
                item.options.baseURL ? `链接: ${item.options.baseURL}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
            })),
          }),
          actions.inputs.patch({
            options: VendorList,
          }),
        ),
      }),
      actions.class.component('flex *:flex-1 gap-2 items-center'),
    ),
    v.pipe(
      v.object({
        baseURL: v.pipe(
          v.optional(v.string(), 'http://127.0.0.1:11434/v1'),
          v.title('地址'),
          v.description('openai兼容接口'),
          ...InputWrapper,
        ),
        model: v.pipe(
          v.optional(v.string(), `qwen3:8b`),
          v.title('模型'),
          v.description(
            '## 模型名\n### ollama模型推荐\n- `qwen3:8b`\n- `qwen3:14b`,`deepseek-r1:7b`,`deepseek-r1:14b`\n### 图片对话模型\n- `minicpm-v:8b`',
          ),
          ...InputWrapper,
        ),
      }),
      actions.class.component('flex *:flex-1 gap-2 items-center'),
    ),
    v.object({
      apiKey: v.pipe(
        v.optional(v.string()),
        v.description('本地部署默认可以不填'),
      ),
    }),
    v.pipe(
      v.object({
        max_tokens: v.pipe(v.optional(v.number(), 8192)),
        top_p: v.pipe(
          v.optional(v.number(), 0.8),
          v.minValue(0),
          v.maxValue(10),
          v.description(`核采样（nucleus sampling）是温度采样的另一种替代方法，模型会考虑累积概率质量达到 top_p 的 token。例如，当 top_p 设为 0.1 时，仅考虑累积概率前 10% 的 token。

我们通常建议调整 top_p 或温度参数，但不要同时调整两者。`),
          ...InputWrapper,
        ),
        temperature: v.pipe(
          v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(2)), 0.1),
          v.description(
            '采样温度应设置在0到2之间。较高的值（如0.8）会使输出更随机，而较低的值（如0.2）则会使输出更集中且确定。我们通常建议仅调整此参数或top_p，而不同时调整两者。',
          ),
          ...InputWrapper,
        ),
        frequency_penalty: v.pipe(
          v.optional(v.pipe(v.number(), v.minValue(-2), v.maxValue(2))),
          v.description(
            '取值范围为-2.0至2.0。正值会根据当前文本中已有标记的频率对新标记进行惩罚，从而降低模型逐字重复相同内容的概率。',
          ),
          ...InputWrapper,
        ),
        presence_penalty: v.pipe(
          v.optional(v.pipe(v.number(), v.minValue(-2), v.maxValue(2))),
          v.description(
            '数值介于-2.0至2.0之间。正值会基于新标记是否已在当前文本中出现，对新标记施加惩罚，从而提升模型讨论新话题的可能性。',
          ),
          ...InputWrapper,
        ),
        seed: v.pipe(
          v.optional(v.pipe(v.number())),
          v.description(
            '若已指定，系统将尽力确保采样具有确定性，即使用相同种子和参数的重复请求将返回相同结果。确定性无法保证，请通过 system_fingerprint 响应参数监控后端变化。',
          ),
          ...InputWrapper,
        ),
        stop: v.pipe(
          v.optional(v.pipe(v.array(v.pipe(v.string())), v.maxLength(4))),
          v.description(
            '最多可指定4个停止序列，API将在生成到该序列时停止，返回的文本中不包含该停止序列。',
          ),
          asControl(),
          setComponent('chip-input-list'),
          actions.inputs.patch({
            addOnBlur: true,
          }),
          ...InputWrapper,
        ),
        //   top_logprobs: v.pipe(
        //     v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(20))),
        //     v.description(
        //       '一个介于0和20之间的整数，用于指定在每个标记位置返回的最可能的标记数量，每个标记均关联对应的对数概率。若使用此参数，则必须将logprobs设置为true。',
        //     ),
        //   ),

        //   verbosity: v.pipe(
        //     v.optional(v.picklist(['low', 'medium', 'high'])),
        //     v.description(
        //       `控制模型回复的详细程度。数值越低，回复越简洁；数值越高，回复越详细。当前支持的取值为低、中和高。`,
        //     ),
        //   ),
        //   reasoning_effort: v.pipe(
        //     v.optional(v.picklist(['minimal', 'low', 'medium', 'high'])),
        //     v.description(
        //       `控制模型回复的详细程度。数值越低，回复越简洁；数值越高，回复越详细。当前支持的取值为低、中和高。`,
        //     ),
        //   ),
      }),
      actions.class.component('grid gap-2'),
    ),
  ]),
  actions.class.component('grid gap-2'),
  asVirtualGroup(),
);

export const VendorOptionsDefine = v.pipe(
  v.optional(
    v.record(
      v.string(),
      v.pipe(
        v.intersect([
          v.object({
            /** @internal */
            extraOptions: v.pipe(
              v.optional(omitIntersect(ChatItemDefine, ['name', 'vendor'])),
              v.description(`附加配置`),
            ),
          }),
        ]),
        actions.class.component('grid gap-2'),
        asVirtualGroup(),
      ),
    ),
  ),
  v.description(vendorOptionsDescribe),
  setComponent('rest-chip-group'),
  actions.inputs.patch({
    optionalkeyList: VendorList.map((item) => item.value),
    placeholder: '请设置额外配置',
  }),
  v.title('厂商额外配置'),
);
export const ChatParamsItemDefine = v.pipe(
  v.intersect([
    ChatItemDefine,
    v.object({ vendorOptions: VendorOptionsDefine }),
  ]),
  asVirtualGroup(),
  actions.class.component('grid gap-2'),
);

export const ChatParamsListDefine = v.pipe(
  v.array(ChatParamsItemDefine),
  setComponent('label-chip-array'),
  v.description('对话模型列表,目前用于切换使用'),
  actions.inputs.patch({
    displayKey: 'name',
    placeholder: '请添加配置',
  }),
);
export type ChatModelOptions = v.InferOutput<typeof ChatParamsItemDefine>;
export type ChatModelOptionsInput = v.InferInput<typeof ChatParamsItemDefine>;

export const InputChatOptionsDefine = omitIntersect(ChatParamsItemDefine, [
  'name',
]);
export type CreateChatModelOptions = v.InferInput<
  typeof InputChatOptionsDefine
>;
