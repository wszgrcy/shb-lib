export function numberToChinese(num: number): string {
  const CHINESE_NUMBERS = [
    '零',
    '一',
    '二',
    '三',
    '四',
    '五',
    '六',
    '七',
    '八',
    '九',
  ];
  const UNITS = ['', '十', '百', '千', '万'];

  if (num === 0) return CHINESE_NUMBERS[0];

  let result = '';
  let unitPos = 0;
  let zero = false;

  while (num > 0) {
    const digit = num % 10;
    if (digit === 0) {
      if (!zero) {
        result = '零' + result;
        zero = true;
      }
    } else {
      result = CHINESE_NUMBERS[digit] + UNITS[unitPos] + result;
      zero = false;
    }
    num = Math.floor(num / 10);
    unitPos++;
  }

  result = result
    .replace(/零+/g, '零')
    .replace(/零+$/, '')
    .replace(/^一十/, '十');

  return result;
}
