import { ChatModelOptions } from '../options.define';
import { OpenAIChat } from './openai';
const VendorObject: Record<
  string,
  { options: { baseURL: string; modelList: string[] } }
> = {
  '360': { options: { baseURL: 'https://ai.360.cn', modelList: [] } },
  azure: { options: { baseURL: '', modelList: [] } },
  moonshot: { options: { baseURL: 'https://api.moonshot.cn', modelList: [] } },
  baichuan: {
    options: { baseURL: 'https://api.baichuan-ai.com', modelList: [] },
  },
  minimax: { options: { baseURL: 'https://api.minimax.chat', modelList: [] } },
  mistralai: { options: { baseURL: 'https://api.mistral.ai', modelList: [] } },
  groq: {
    options: { baseURL: 'https://api.groq.com/openai', modelList: [] },
  },
  lingyiwanwu: {
    options: { baseURL: 'https://api.lingyiwanwu.com', modelList: [] },
  },
  stepfun: { options: { baseURL: 'https://api.stepfun.com', modelList: [] } },
  deepseek: { options: { baseURL: 'https://api.deepseek.com', modelList: [] } },
  'together.ai': {
    options: { baseURL: 'https://api.together.xyz', modelList: [] },
  },
  volcengine: {
    options: {
      baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
      modelList: [],
    },
  },
  novita: {
    options: { baseURL: 'https://api.novita.ai/v3/openai', modelList: [] },
  },
  siliconflow: {
    options: { baseURL: 'https://api.siliconflow.cn', modelList: [] },
  },
  // 官网明确兼容
  // https://help.aliyun.com/zh/model-studio/developer-reference/use-qwen-by-calling-api?spm=a2c6h.13066369.question.5.3a0e527bbxeJLJ#4ec3e641c294d
  tongyi: {
    options: {
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      modelList: [],
    },
  },
  // 文档上看是一样的
  // https://open.bigmodel.cn/dev/api/normal-model/glm-4
  zhipu: {
    options: {
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      modelList: [],
    },
  },
  // 明确兼容
  // https://www.xfyun.cn/doc/spark/HTTP%E8%B0%83%E7%94%A8%E6%96%87%E6%A1%A3.html#_7-%E4%BD%BF%E7%94%A8openai-sdk%E8%AF%B7%E6%B1%82%E7%A4%BA%E4%BE%8B
  spark: {
    options: {
      baseURL: 'https://spark-api-open.xf-yun.com/v1',
      modelList: [],
    },
  },
  // 官方兼容
  // https://cloud.tencent.com/document/product/1729/111007
  hunyuan: {
    options: {
      baseURL: 'https://api.hunyuan.cloud.tencent.com/v1',
      modelList: [],
    },
  },
};

export function createCompatibleFactory(options: ChatModelOptions) {
  const vendorConfig = VendorObject[options.vendor];
  return new OpenAIChat({
    ...options,
    baseURL: vendorConfig.options.baseURL,
  });
}
