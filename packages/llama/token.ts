import { InjectionToken, Signal } from 'static-injector';
export interface LLamaConfig {
  dir: string;
  listen: string;
  useRelConfigPath?: boolean;
  /** 配合相对路径使用 */
  cwd?: string;
}
export const LLamaConfigToken = new InjectionToken<Signal<LLamaConfig>>(
  'LLamaConfig',
);
export const OLLAMA_MODEL_URL_TOKEN = new InjectionToken<Signal<string>>(
  'OLLAMA_MODEL_URL',
);
