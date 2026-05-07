import { uniq } from 'es-toolkit';
const arabicDigits = `0123456789`;
const chineseDigits = `零一二三四五六七八九`;
const chineseCurrencyDigits = `〇壹贰叁肆伍陆柒捌玖`;
function strToObj(str: string) {
  return str.split('').reduce(
    (obj, str, i) => {
      obj[str] = i;
      return obj;
    },
    {} as Record<string, number>,
  );
}
function getNumberMap() {
  return {
    ...strToObj(arabicDigits),
    ...strToObj(chineseDigits),
    ...strToObj(chineseCurrencyDigits),
  };
}

const chineseSUnit = [
  { label: '个', value: 10 ** 0 },
  { label: '十', value: 10 ** 1 },
  { label: '百', value: 10 ** 2 },
  { label: '千', value: 10 ** 3 },
  { label: '万', value: 10 ** 4 },
  { label: '亿', value: 10 ** 8 },
  { label: '拾', value: 10 ** 1 },
  { label: '佰', value: 10 ** 2 },
  { label: '仟', value: 10 ** 3 },
];
function toRatioObj(
  list: {
    label: string;
    value: number;
  }[],
) {
  return list.reduce(
    (obj, item, i) => {
      obj[item.label] = item.value;
      return obj;
    },
    {} as Record<string, number>,
  );
}
function getUnitMap() {
  return {
    ...toRatioObj(chineseSUnit),
  };
}

function getFullMatch() {
  const numberLike = uniq(
    `${arabicDigits}${chineseDigits}${chineseCurrencyDigits}`.split(''),
  ).join('');
  const unitLike = uniq(chineseSUnit.map((item) => item.label)).join('');
  return `([${numberLike}])|([${unitLike}])|(.)`;
}

export const __NUMBER_MAP = getNumberMap();
export const __UNIT_MAP = getUnitMap();
export const __FULL_REGEXP_STR = getFullMatch();
