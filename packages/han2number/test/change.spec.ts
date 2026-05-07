import { han2numberReChange } from '../index';
import { expect } from 'chai';
describe('排序', () => {
  it('数字转换', () => {
    const list = ['第一百零一章'];
    for (const item of list) {
      const result = han2numberReChange(item, (item, i) => {
        if (typeof item === 'number') {
          return `${item - 1}`;
        }
        return item;
      });

      expect(result).eq('第100章');
    }
  });
  it('转换', () => {
    const list = ['101'];
    for (const item of list) {
      const result = han2numberReChange(item, (item, i) => {
        if (typeof item === 'number') {
          return `${item - 1}`;
        }
        return item;
      });

      expect(result).eq('100');
    }
  });
});
