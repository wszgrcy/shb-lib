import * as v from 'valibot';

import { getModel, Model } from '@earendil-works/pi-ai';
import { KnownProviderDefine } from '../provider.define';
import {
  actions,
  asControl,
  hideWhen,
  renderConfig,
  setAlias,
  setComponent,
} from '@piying/view-angular-core';
import { map } from 'rxjs';

function getCustomProvider<
  T extends 'openai-completions' | 'openai-responses' | 'anthropic-messages',
>(
  compat: T,
  model: string,
  name: string,
  input: Omit<Model<T>, 'api' | 'id' | 'name'>,
) {
  return { ...input, id: model, api: compat, name } satisfies Model<T>;
}
export function getModelConfig(input: ModelConfigInputType) {
  if (input.provider === ('faux' as any)) {
    return {
      model: input.config as Model<any>,
      config: input as ModelConfigOutputType,
    };
  }
  const config = v.parse(ModelConfigDefine, input);
  if (
    config.provider === 'openai-completions' ||
    config.provider === 'openai-responses' ||
    config.provider === 'anthropic-messages'
  ) {
    return {
      model: getCustomProvider(
        config.provider,
        config.model,
        config.name,
        config.config!,
      ),
      config: config,
    };
  }

  return {
    model: getModel(config.provider, config.model as any as never),
    config: config,
  };
}
export const ThinkingLevelSchema = v.pipe(
  v.picklist(['minimal', 'low', 'medium', 'high', 'xhigh']),
  v.title('思考等级'),
  v.description('模型思考的详细程度，从最小到最大'),
);

export const ModelThinkingLevelSchema = v.pipe(
  v.picklist(['off', 'minimal', 'low', 'medium', 'high', 'xhigh']),
  v.title('模型思考等级'),
  v.description('关闭或设置模型思考的详细程度'),
);

// --- Compat schemas (conditional on TApi) ---

/** OpenAI Completions compatibility overrides */
export const OpenAICompletionsCompatSchema = v.pipe(
  v.optional(
    v.object({
      supportsStore: v.optional(
        v.pipe(
          v.boolean(),
          v.title('支持存储'),
          v.description('是否支持服务端会话存储'),
        ),
      ),
      supportsDeveloperRole: v.optional(
        v.pipe(
          v.boolean(),
          v.title('支持开发者角色'),
          v.description('是否支持 developer 系统消息角色'),
        ),
      ),
      supportsReasoningEffort: v.optional(
        v.pipe(
          v.boolean(),
          v.title('支持推理努力'),
          v.description('是否支持 reasoning_effort 参数'),
        ),
      ),
      supportsUsageInStreaming: v.optional(
        v.pipe(
          v.boolean(),
          v.title('流式用量'),
          v.description('流式输出中是否返回 usage 信息'),
        ),
      ),
      maxTokensField: v.optional(
        v.pipe(
          v.picklist(['max_completion_tokens', 'max_tokens']),
          v.title('最大 token 字段名'),
          v.description('指定最大 token 参数使用的是哪个字段名'),
        ),
      ),
      requiresToolResultName: v.optional(
        v.pipe(
          v.boolean(),
          v.title('需要工具结果名称'),
          v.description('是否要求工具结果消息包含 name 字段'),
        ),
      ),
      requiresAssistantAfterToolResult: v.optional(
        v.pipe(
          v.boolean(),
          v.title('需要助手回复'),
          v.description('工具结果后是否需要助手消息跟进'),
        ),
      ),
      requiresThinkingAsText: v.optional(
        v.pipe(
          v.boolean(),
          v.title('思考转文本'),
          v.description('是否将思考过程作为普通文本发送'),
        ),
      ),
      requiresReasoningContentOnAssistantMessages: v.optional(
        v.pipe(
          v.boolean(),
          v.title('推理内容在助手消息中'),
          v.description('是否在助手消息中包含推理内容'),
        ),
      ),
      thinkingFormat: v.optional(
        v.pipe(
          v.picklist([
            'openai',
            'openrouter',
            'deepseek',
            'together',
            'zai',
            'qwen',
            'qwen-chat-template',
            'string-thinking',
            'ant-ling',
          ]),
          v.title('思考格式'),
          v.description('指定 thinking 标签的序列化格式'),
        ),
      ),
      openRouterRouting: v.optional(
        v.pipe(
          v.any(),
          v.title('OpenRouter 路由'),
          v.description('自定义 OpenRouter 的路由配置'),
          renderConfig({ hidden: true }),
        ),
      ),
      vercelGatewayRouting: v.optional(
        v.pipe(
          v.any(),
          v.title('Vercel Gateway 路由'),
          v.description('自定义 Vercel AI Gateway 的路由配置'),
          renderConfig({ hidden: true }),
        ),
      ),
      zaiToolStream: v.optional(
        v.pipe(
          v.boolean(),
          v.title('ZAI 工具流式'),
          v.description('是否启用 ZAI 平台工具调用的流式输出'),
        ),
      ),
      supportsStrictMode: v.optional(
        v.pipe(
          v.boolean(),
          v.title('严格模式'),
          v.description('是否支持工具的 JSON Schema 严格校验'),
        ),
      ),
      cacheControlFormat: v.optional(
        v.pipe(
          v.literal('anthropic'),
          v.title('缓存控制格式'),
          v.description('指定缓存控制的语法格式'),
          renderConfig({ hidden: true }),
        ),
      ),
      sendSessionAffinityHeaders: v.optional(
        v.pipe(
          v.boolean(),
          v.title('发送会话亲和标头'),
          v.description('是否在请求中携带会话亲和性标头'),
        ),
      ),
      supportsLongCacheRetention: v.optional(
        v.pipe(
          v.boolean(),
          v.title('长期缓存保留'),
          v.description('是否支持长期缓存保留策略'),
        ),
      ),
    }),
  ),
  v.title('OpenAI Completions 兼容配置'),
  v.description('针对 OpenAI Completions API 的兼容性覆写选项'),
);

/** OpenAI Responses compatibility overrides */
export const OpenAIResponsesCompatSchema = v.pipe(
  v.optional(
    v.object({
      supportsDeveloperRole: v.optional(
        v.pipe(
          v.boolean(),
          v.title('支持开发者角色'),
          v.description('是否支持 developer 系统消息角色'),
        ),
      ),
      sendSessionIdHeader: v.optional(
        v.pipe(
          v.boolean(),
          v.title('发送会话 ID 标头'),
          v.description('是否在请求中携带 X-Session-ID 标头'),
        ),
      ),
      supportsLongCacheRetention: v.optional(
        v.pipe(
          v.boolean(),
          v.title('长期缓存保留'),
          v.description('是否支持长期缓存保留策略'),
        ),
      ),
    }),
  ),
  v.title('OpenAI Responses 兼容配置'),
  v.description('针对 OpenAI Responses API 的兼容性覆写选项'),
);

/** Anthropic Messages compatibility overrides */
export const AnthropicMessagesCompatSchema = v.pipe(
  v.optional(
    v.object({
      supportsEagerToolInputStreaming: v.optional(
        v.pipe(
          v.boolean(),
          v.title(' eagerly 工具流式'),
          v.description('是否支持工具调用的 eager 模式流式输出'),
        ),
      ),
      supportsLongCacheRetention: v.optional(
        v.pipe(
          v.boolean(),
          v.title('长期缓存保留'),
          v.description('是否支持长期缓存保留策略'),
        ),
      ),
      sendSessionAffinityHeaders: v.optional(
        v.pipe(
          v.boolean(),
          v.title('发送会话亲和标头'),
          v.description('是否在请求中携带会话亲和性标头'),
        ),
      ),
      supportsCacheControlOnTools: v.optional(
        v.pipe(
          v.boolean(),
          v.title('工具缓存控制'),
          v.description('是否支持在 tool_use 消息中使用 cache_control'),
        ),
      ),
      supportsTemperature: v.optional(
        v.pipe(
          v.boolean(),
          v.title('支持温度参数'),
          v.description('模型/接口是否支持 temperature 参数'),
        ),
      ),
      forceAdaptiveThinking: v.optional(
        v.pipe(
          v.boolean(),
          v.title('强制自适应思考'),
          v.description('是否强制启用 adaptive thinking 模式'),
        ),
      ),
      allowEmptySignature: v.optional(
        v.pipe(
          v.boolean(),
          v.title('允许空签名'),
          v.description('是否允许工具调用不指定签名(sha256)'),
        ),
      ),
    }),
  ),
  v.title('Anthropic Messages 兼容配置'),
  v.description('针对 Anthropic Messages API 的兼容性覆写选项'),
);

// Generic compat schema (union of all compat types)
export const CompatSchema = v.pipe(
  v.union([
    v.pipe(
      OpenAICompletionsCompatSchema,
      actions.wrappers.patch([
        { type: 'div', attributes: { class: 'grid gap-2' } },
      ]),
      hideWhen({
        disabled: true,
        listen(fn, field) {
          return fn({ list: [['@provider']] }).pipe(
            map((item) => item.list[0] !== 'openai-completions'),
          );
        },
      }),
    ),
    v.pipe(
      OpenAIResponsesCompatSchema,
      actions.wrappers.patch([
        { type: 'div', attributes: { class: 'grid gap-2' } },
      ]),
      hideWhen({
        disabled: true,
        listen(fn, field) {
          return fn({ list: [['@provider']] }).pipe(
            map((item) => item.list[0] !== 'openai-responses'),
          );
        },
      }),
    ),
    v.pipe(
      AnthropicMessagesCompatSchema,
      actions.wrappers.patch([
        { type: 'div', attributes: { class: 'grid gap-2' } },
      ]),
      hideWhen({
        disabled: true,
        listen(fn, field) {
          return fn({ list: [['@provider']] }).pipe(
            map((item) => item.list[0] !== 'anthropic-messages'),
          );
        },
      }),
    ),
  ]),
  setComponent('object'),
  v.title('兼容配置'),
  v.description(
    '模型 API 兼容性覆写选项，支持 OpenAI Completions、OpenAI Responses、Anthropic Messages 三种格式',
  ),
);

// --- Input array: ("text" | "image")[] ---

export const InputChoiceSchema = v.pipe(
  v.picklist(['text', 'image']),
  v.title('输入类型'),
  v.description('支持的输入模态类型'),
);
export const InputSchema = v.pipe(
  v.array(InputChoiceSchema),
  v.title('输入类型列表'),
  v.description('该模型支持的用户输入类型，如 text 文本或 image 图片'),
);

// --- Headers: Record<string, string> ---

const HeadersSchema = v.pipe(
  v.record(v.string(), v.string()),
  v.title('自定义请求头'),
  v.description('额外的 HTTP 请求头键值对配置'),
  renderConfig({ hidden: true }),
);

// --- Model schema (non-generic) ---

/** Cost sub-schema */
const CostSchema = v.pipe(
  v.optional(
    v.object({
      input: v.pipe(
        v.number(),
        v.title('输入单价'),
        v.description('每 token 输入费用'),
      ),
      output: v.pipe(
        v.number(),
        v.title('输出单价'),
        v.description('每 token 输出费用'),
      ),
      cacheRead: v.pipe(
        v.number(),
        v.title('缓存读取单价'),
        v.description('从缓存读取每 token 的费用'),
      ),
      cacheWrite: v.pipe(
        v.number(),
        v.title('缓存写入单价'),
        v.description('写入缓存每 token 的费用'),
      ),
    }),
    { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  ),
  v.title('费用配置'),
  v.description('模型各操作类型的 token 计价标准'),
);

/** Thinking level map: Partial<Record<ModelThinkingLevel, string | null>> */
const ThinkingLevelMapSchema = v.pipe(
  v.record(
    ModelThinkingLevelSchema,
    v.pipe(
      v.nullish(v.string()),
      v.title('配置值'),
      v.description('对应思考等级的具体配置字符串，null 表示未设置'),
    ),
  ),
  v.title('思考等级配置映射'),
  v.description('各思考等级对应的具体配置参数映射'),
);

/**
 * Model schema for pi-ai models.
 * Matches `Model<TApi extends Api>` but without generic type preservation
 * at runtime — compat accepts any of the three compat variants via union.
 */
export const ModelSchema = v.pipe(
  v.object({
    provider: v.pipe(
      v.optional(v.string(), 'default'),
      v.title('厂商'),
      v.description('模型提供商，如 openai / anthropic / llama'),
    ),
    baseUrl: v.pipe(
      v.string(),
      v.title('基础 URL'),
      v.description('API 请求的基础地址'),
    ),
    reasoning: v.pipe(
      v.optional(v.boolean(), false),
      v.title('支持推理'),
      v.description('该模型是否支持思考/推理模式'),
    ),
    // thinkingLevelMap: v.optional(
    //   v.pipe(
    //     v.optional(ThinkingLevelMapSchema),
    //     v.title('思考等级配置'),
    //     v.description('各思考等级的具体参数配置映射'),
    //   ),
    // ),
    input: v.pipe(
      v.optional(InputSchema, ['text', 'image']),
      asControl(),
      setComponent('picklist'),
      actions.inputs.set({ multiple: true, options: ['text', 'image'] }),
      v.title('输入类型'),
      v.description('支持的输入模态类型'),
    ),
    cost: v.pipe(
      CostSchema,
      renderConfig({ hidden: true }),
      v.title('费用配置'),
      v.description('模型 token 计价标准'),
    ),
    contextWindow: v.pipe(
      v.pipe(v.optional(v.number(), 99999999)),
      v.title('上下文窗口'),
      v.description('模型支持的上下文最大 token 数'),
    ),
    maxTokens: v.pipe(
      v.pipe(v.optional(v.number(), 99999999)),
      v.title('最大输出 tokens'),
      v.description('单次请求允许的最大输出 token 数'),
    ),
    headers: v.optional(
      v.pipe(
        v.optional(HeadersSchema),
        v.title('自定义请求头'),
        v.description('额外的 HTTP 请求头配置'),
      ),
    ),
    compat: v.pipe(
      v.optional(CompatSchema, { supportsDeveloperRole: false }),
      v.title('兼容配置'),
      v.description('API 兼容性覆写选项'),
    ),
  }),
  v.title('模型定义'),
  v.description(
    'pi-ai 模型的核心配置结构，包含模型标识、API 参数、费用及兼容性设置',
  ),
);

export type ModelInput = v.InferInput<typeof ModelSchema>;
export type ModelOutput = v.InferOutput<typeof ModelSchema>;

// --- ImagesModel schema ---

/** Output array for image models: ("text" | "image")[] */

export const ModelConfigDefine = v.pipe(
  v.object({
    provider: v.pipe(KnownProviderDefine, setAlias('provider')),
    model: v.pipe(v.string(), v.title('模型名')),
    name: v.pipe(
      v.optional(v.string()),
      v.title('配置名'),
      v.description('模型的配置名称(默认为模型名)'),
    ),
    /** provider是自定义时使用 */
    apiKey: v.pipe(v.optional(v.string()), v.title('apiKey')),
    config: v.pipe(
      v.optional(ModelSchema),
      hideWhen({
        disabled: true,
        listen(fn, field) {
          return fn({ list: [['..', 'provider']] }).pipe(
            map(
              ({ list: [value] }) =>
                !(
                  value === 'openai-completions' ||
                  value === 'openai-responses' ||
                  value === 'anthropic-messages'
                ),
            ),
          );
        },
      }),
    ),
  }),
  v.transform((item) => ({ ...item, name: item.name ?? item.model })),
);

export type ModelConfigInputType = v.InferInput<typeof ModelConfigDefine>;
export type ModelConfigOutputType = v.InferOutput<typeof ModelConfigDefine>;
