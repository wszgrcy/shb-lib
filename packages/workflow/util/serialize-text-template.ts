import { get, toPath } from 'es-toolkit/compat';
import type { ChatMetadata } from '../share/type';
import {
  SimplifiedState,
  serializeSimplifiedState,
} from '@shenghuabi/lexical-textarea';

export interface SerializeContextOptions {
  /** 节点上下文 */
  context: Record<string, unknown>;
  /** 环境参数上下文 */
  environmentContext: Record<string, unknown>;
  /** 元数据回调：解析后调用，传入收集到的元数据 */
  onMetadata?: (metadata: ChatMetadata[]) => void;
}

/**
 * 序列化模板并解析上下文引用
 * @param input - 输入内容（字符串或模板对象）
 * @param options - 上下文选项
 * @returns 序列化后的字符串
 */
export function serializeLexicalTextarea(
  input: SimplifiedState | string,
  options: SerializeContextOptions,
): string {
  if (typeof input === 'string') {
    return input;
  }
  const { context, environmentContext, onMetadata } = options;

  const resolve = (value: unknown): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(resolve).join('\n');
    }
    if (value && typeof value === 'object') {
      if ('ref' in value) {
        onMetadata?.(Array.isArray(value.ref) ? value.ref : [value.ref]);
      }
      return `${value}`;
    }
    return `${value}`;
  };

  return serializeSimplifiedState(input, (item) => {
    if (item.type === 'custom') {
      return get(environmentContext, item.value);
    }
    const result = get(context, [...item.value, ...toPath(item.suffix ?? [])]);
    return resolve(result).trim();
  }).trim();
}
