import * as v from 'valibot';
import { KnownProvider } from '@earendil-works/pi-ai';
export const KnownProviderDefine = v.pipe(
  v.picklist([
    'amazon-bedrock',
    'anthropic',
    'google',
    'google-vertex',
    'openai',
    'azure-openai-responses',
    'openai-codex',
    'deepseek',
    'github-copilot',
    'xai',
    'groq',
    'cerebras',
    'openrouter',
    'vercel-ai-gateway',
    'zai',
    'mistral',
    'minimax',
    'minimax-cn',
    'moonshotai',
    'moonshotai-cn',
    'huggingface',
    'fireworks',
    'together',
    'opencode',
    'opencode-go',
    'kimi-coding',
    'cloudflare-workers-ai',
    'cloudflare-ai-gateway',
    'xiaomi',
    'xiaomi-token-plan-cn',
    'xiaomi-token-plan-ams',
    'xiaomi-token-plan-sgp',
    'ant-ling',
    'nvidia',
    'zai-coding-cn',
    /** 自定义 */
    'openai-completions',
    'openai-responses',
    'anthropic-messages',
  ]),
  v.title('提供商'),
  v.description(`'openai-completions','openai-responses','anthropic-messages',为自定义提供商`),
);

export type KnownProviderType = v.InferOutput<typeof KnownProviderDefine>;
type D2T = KnownProvider extends KnownProviderType ? true : false;
type T2D = KnownProviderType extends KnownProvider ? true : false;
