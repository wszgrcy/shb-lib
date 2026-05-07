import { InjectionToken, Signal } from 'static-injector';
import { OpenAIConfig } from './type';

export const OpenAIConfigToken = new InjectionToken<Signal<OpenAIConfig>>(
  'OpenAIConfig',
);
