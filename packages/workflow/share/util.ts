import { v5 } from 'uuid';
const UUID_NS = '404cfae8-94e7-41a6-acec-1037dd1fdaad';
export function generateHandle(value: string, label = value) {
  return { id: v5(value, UUID_NS), label: label, value: value };
}
