import { __NUMBER_MAP, __UNIT_MAP, __FULL_REGEXP_STR } from './inline/index' with { type: 'macro' };
const __FULL_REGEXP = new RegExp(__FULL_REGEXP_STR, 'g');
const enum NumberType {
  number = 0,
  unit = 1,
  any = 2,
}
type NumberTokenItem = {
  type: NumberType.number;
  value: number;
  origin: string;
};
type UnitTokenItem = {
  type: NumberType.unit;
  origin: string;
  ratio: number;
};
type anyTokenItem = {
  type: NumberType.any;
  origin: string;
  value: string;
};
type ValueItem = NumberTokenItem | UnitTokenItem | anyTokenItem;
type NumberTuple = [NumberTokenItem, UnitTokenItem];
type ResultItem = NumberTokenItem | anyTokenItem;

function numberUnitCount(list: NumberTuple) {
  return {
    type: NumberType.number,
    value: (list[0].value || 1) * list[1].ratio,
    origin: `${list[0].origin}${list[1].origin}`,
  } as NumberTokenItem;
}
function numberCount(list: NumberTokenItem[], unit: UnitTokenItem) {
  let count = list.reduce(
    (item, curr) => {
      item.value += curr.value;
      item.origin += curr.origin;
      return item;
    },
    {
      value: 0,
      origin: '',
    },
  );

  return {
    type: NumberType.number,
    value: (count.value || 1) * unit.ratio,
    origin: count.origin + unit.origin,
  } as NumberTokenItem;
}
function itemMerge(list: ResultItem[], cb: (value: string | number, index: number) => string) {
  let count = 0;
  let lastItem = false;
  let content = '';
  const numberList = [];
  let j = 0;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item.type === NumberType.number) {
      count += item.value;
      lastItem = true;
    } else {
      if (lastItem) {
        content += cb(count, j++);
        numberList.push(count);
        count = 0;
      }
      content += cb(item.value, j++);
      lastItem = false;
    }
  }
  if (lastItem) {
    content += cb(count, j++);
    numberList.push(count);
  }
  return { content, numberList };
}
const BASE = 10000;
function getLevel(value: number): number {
  let level = 0;
  while (value >= BASE) {
    value /= BASE;
    level++;
  }
  return level;
}
// 口语不支持 三万五
function han2number(str: string) {
  let match: RegExpExecArray | null;
  let list: ResultItem[] = [];
  let pendingNumberToken: NumberTokenItem | undefined;
  let step = new Uint8Array(3).fill(0);
  let hasUnit = false;
  while ((match = __FULL_REGEXP.exec(str))) {
    let item: ValueItem;
    if (match[1]) {
      item = { value: __NUMBER_MAP[match[1]], origin: match[1], type: NumberType.number };
    } else if (match[2]) {
      item = { ratio: __UNIT_MAP[match[2]], origin: match[2], type: NumberType.unit };
    } else if (match[3]) {
      item = { value: match[3], origin: match[3], type: NumberType.any };
    } else {
      throw '';
    }
    if (item.type === NumberType.any) {
      if (pendingNumberToken) {
        list.push(pendingNumberToken);
        pendingNumberToken = undefined;
      }
      list.push(item);
      step = step.fill(list.length);
      hasUnit = false;
    } else if (item.type === NumberType.number) {
      if (pendingNumberToken) {
        let index = step[0];
        list.push(pendingNumberToken);
        if (!hasUnit) {
          for (let i = index; i < list.length; i++) {
            (list[i].value as number) *= 10;
          }
        }
      }
      pendingNumberToken = item;
    } else if (item.type === NumberType.unit) {
      hasUnit = true;
      let level = getLevel(item.ratio);
      let index = step.at(level)!;
      if (!pendingNumberToken) {
        let data = list.slice(index) as NumberTokenItem[];
        list = list.slice(0, index);
        list.push(numberCount(data, item));
        for (let i = 0; i < level; i++) {
          step[i] = list.length;
        }
        continue;
      }

      if (item.ratio > 1000) {
        let data = list.slice(index) as NumberTokenItem[];
        list = list.slice(0, index);
        list.push(numberCount([...data, pendingNumberToken], item));
        pendingNumberToken = undefined;
        for (let i = 0; i < level; i++) {
          step[i] = list.length;
        }
      } else {
        list.push(numberUnitCount([pendingNumberToken, item]));
        pendingNumberToken = undefined;
      }
    }
  }
  if (pendingNumberToken) {
    list.push(pendingNumberToken);
  }
  return list;
}
export function han2numberFormat(str: string) {
  let result = itemMerge(han2number(str), (str) => `${str}`);
  return result.content;
}
export function han2numberParse(str: string) {
  return itemMerge(han2number(str), (str) => `${str}`);
}
export function han2numberReChange(str: string, cb: (value: string | number, index: number) => string) {
  return itemMerge(han2number(str), cb).content;
}

export function createHan2NumberCompare() {
  const collator = new Intl.Collator(undefined, { numeric: true });
  return (one: string | null, other: string | null) => {
    one ||= '';
    other ||= '';
    return collator.compare(han2numberFormat(one), han2numberFormat(other));
  };
}
