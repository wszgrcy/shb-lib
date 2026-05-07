import { createRootInjector } from 'static-injector';
import { expect } from 'chai';
import path from 'node:path';
import fs from 'node:fs';
import { SplitService } from '../split/split.service';
describe('split', () => {
  it('拆分', async () => {
    const injector = createRootInjector({ providers: [SplitService] });
    const split = injector.get(SplitService);
    // let str = `一一一。x说：“yyy。”`;
    // let str = `“你……你真的要走？”他声音微弱。`;
    const filePath = path.join(
      process.cwd(),
      'packages/tts/test/fixture/text1.txt',
    );

    const text = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
    const result = split.run(text);
    let lastIndex = 0;
    let splitSum = 0;
    for (let index = 0; index < result.length; index++) {
      const item = result[index];
      if (item.start < lastIndex) {
        throw new Error('分割索引异常');
      }
      expect(item.language).eq('chinese');
      expect(item.content.length).greaterThan(0);
      lastIndex = item.end;
      splitSum += item.content.length;
    }
    expect(splitSum / text.length).greaterThan(0.8);
  });
  it('一句', async () => {
    const injector = createRootInjector({ providers: [SplitService] });
    const split = injector.get(SplitService);
    const result = split.run('你好啊');
    expect(result.length).eq(1);
  });
  it('带对话末尾', async () => {
    const injector = createRootInjector({ providers: [SplitService] });
    const split = injector.get(SplitService);
    const result = split.run('我听其他人说：“这是第一句。”这是第二句');
    expect(result.length).eq(3);
    expect(result[0].content).eq('我听其他人说：');
    expect(result[1].content).eq('这是第一句。');
    expect(result[2].content).eq('这是第二句');
  });
  it('起始侧对话', async () => {
    const injector = createRootInjector({ providers: [SplitService] });
    const split = injector.get(SplitService);
    const List = [
      ['“', '”'],
      ['‘', '’'],
      ['「', '」'],
      ['『', '』'],
    ];
    for (const item of List) {
      const result = split.run(
        `我听其他人说：${item[0]}这是第一句。${item[1]}`,
      );
      expect(result.length).eq(2);
      expect(result[0].content).eq('我听其他人说：');
      expect(result[1].content).eq('这是第一句。');
    }
  });
  it('左侧对话', async () => {
    const injector = createRootInjector({ providers: [SplitService] });
    const split = injector.get(SplitService);
    const List = [
      ['“', '”'],
      ['‘', '’'],
      ['「', '」'],
      ['『', '』'],
    ];
    for (const item of List) {
      const result = split.run(
        `默认陈述。我听其他人说：${item[0]}这是第一句。${item[1]}`,
      );
      expect(result.length).eq(2);
      expect(result[0].content).eq('默认陈述。我听其他人说：');
      expect(result[1].content).eq('这是第一句。');
      expect((result[1] as any).context).eq('我听其他人说');
    }
  });
  it('可能为对话', async () => {
    const injector = createRootInjector({ providers: [SplitService] });
    const split = injector.get(SplitService);
    const List = [
      ['“', '”'],
      ['‘', '’'],
      ['「', '」'],
      ['『', '』'],
    ];
    for (const item of List) {
      const result = split.run(`${item[0]}这是第一句。${item[1]}`);
      expect(result.length).eq(1);
      expect(result[0].type).eq('chat');
      expect(result[0].content).eq('这是第一句。');
    }
  });
  it('右侧对话', async () => {
    const injector = createRootInjector({ providers: [SplitService] });
    const split = injector.get(SplitService);
    const List = [
      ['“', '”'],
      ['‘', '’'],
      ['「', '」'],
      ['『', '』'],
    ];
    for (const item of List) {
      const result = split.run(`${item[0]}这是第一句。${item[1]}右侧内容`);
      expect(result.length).eq(2);
      expect(result[0].type).eq('chat');
      expect(result[0].content).eq('这是第一句。');
      expect(result[1].content).eq('右侧内容');
    }
  });
  it('开头', async () => {
    const injector = createRootInjector({ providers: [SplitService] });
    const split = injector.get(SplitService);
    let result = split.run('这是第1句。“这是第2句。”这是第3句');
    expect(result.length).eq(3);
    expect(result[0].content).eq('这是第1句。');
    expect(result[0].isStart).eq(true);
    expect(result[1].content).eq('这是第2句。');
    expect(result[1].isStart).eq(false);
    expect(result[2].content).eq('这是第3句');
    expect(result[2].isStart).eq(false);
    result = split.run('  这是第1句。\n这是第2句。\n  这是第3句。');
    expect(result[0].isStart).eq(true);
    expect(result[1].isStart).eq(true);
    expect(result[2].isStart).eq(true);
  });
  it('包含空行', async () => {
    const injector = createRootInjector({ providers: [SplitService] });
    const split = injector.get(SplitService);
    const result =
      split.run(`七巷一个漆匠，西巷一个锡匠。　 七巷漆匠用了西巷锡匠的锡，　 西巷锡匠拿了七巷漆匠的漆，　 七巷漆匠气西巷锡匠用了漆，　 西巷锡匠讥七巷漆匠拿了锡。
　　
`);
    expect(result.length).eq(1);
  });
});
