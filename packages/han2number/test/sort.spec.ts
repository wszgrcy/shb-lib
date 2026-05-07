import { createHan2NumberCompare } from '../index';
import { expect } from 'chai';
describe('排序', () => {
  it('汉字数字', () => {
    const list = ['一百', '九十九', '一百零一'];
    list.sort(createHan2NumberCompare());
    expect(list).deep.eq(['九十九', '一百', '一百零一']);
  });
  it('纯数字', () => {
    const list = ['100', '99', '101'];
    list.sort(createHan2NumberCompare());
    expect(list).deep.eq(['99', '100', '101']);
  });
  it('混合', () => {
    const list = ['一百', '99', '一零一'];
    list.sort(createHan2NumberCompare());
    expect(list).deep.eq(['99', '一百', '一零一']);
  });
  it('数字+其他', () => {
    const list = ['第一百章', '第九十九章', '第一百零一章'];
    list.sort(createHan2NumberCompare());
    expect(list).deep.eq(['第九十九章', '第一百章', '第一百零一章']);
  });
});
