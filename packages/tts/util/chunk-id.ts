import { v5 } from 'uuid';
import { getUniqueObjectKey } from './uniq-object-key';
import { UUID_NS } from '../const';

export function generateChunkId(...args: any[]) {
  return v5(
    args
      .map((arg) => (typeof arg === 'string' ? arg : getUniqueObjectKey(arg)))
      .join('-'),
    UUID_NS,
  );
}
