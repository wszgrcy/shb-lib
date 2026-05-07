import { NODE_COMMON } from '../common';
import { TextareaRunner } from './textarea.runner';

export const TextMainConfig = {
  ...NODE_COMMON,
  runner: TextareaRunner,
} as const;
