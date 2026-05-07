import { Crunker } from '../crunker';
import fs from 'fs';
import path from 'path';
import { decodeWav } from '../wav-decode';
import { copyConcat } from '../copy-concat';
import { expect } from 'chai';
import Parser from 'srt-parser-2';
const parser = new Parser();
function parseSync(srt: string) {
  return parser.fromSrt(srt);
}
const fixtureDir = path.join(
  process.cwd(),
  'packages/crunker/test',
  './fixture',
);
describe('template', () => {
  const outputDir = path.join(process.cwd(), '.tmp');
  beforeEach(async () => {
    await fs.promises.rm(outputDir, { recursive: true, force: true });
    await fs.promises.mkdir(outputDir);
  });
  afterEach(async () => {
    await fs.promises.rm(path.join(fixtureDir, 'test3_132.wav'), {
      force: true,
    });
    await fs.promises.rm(path.join(fixtureDir, 'test3_150.wav'), {
      force: true,
    });
  });
  it('hello', async () => {
    // 采样率要和原本的一样,否则的话声音会异常
    const instance = new Crunker({ sampleRate: 48000 });
    const file3 = await fs.promises.readFile(
      path.join(
        process.cwd(),
        'packages/crunker/test',
        './fixture/output1.wav',
      ),
    );
    const list = await instance.decodeFiles([file3]);
    const concatedBuffer = instance.concatAudio([list[0], list[0]]);
    const fileBuffer = instance.export(concatedBuffer);
    await fs.promises.mkdir(outputDir, { recursive: true });
    await fs.promises.writeFile(path.join(outputDir, 'output.wav'), fileBuffer);
  });
  it('decode-info', async () => {
    const inputFilePath = path.join(
      process.cwd(),
      'packages/crunker/test',
      './fixture/test3.wav',
    );
    const outputFilePath = path.join(outputDir, 'copy');
    const inputdata = decodeWav(await fs.promises.readFile(inputFilePath));
    await copyConcat(
      [
        { type: 'file', filePath: inputFilePath, subtitle: { text: '' } },
        { type: 'file', filePath: inputFilePath, subtitle: { text: '' } },
      ],
      outputFilePath,
    );
    const outputdata = decodeWav(
      await fs.promises.readFile(outputFilePath + '.wav'),
    );
    expect(inputdata.channels).deep.eq(outputdata.channels);
    expect(inputdata.sampleRate).deep.eq(outputdata.sampleRate);
    expect(inputdata.fmt).deep.eq(outputdata.fmt);
    expect(inputdata.size * 2).deep.eq(outputdata.size);
  });
  it('空白音频添加', async () => {
    const inputFilePath = path.join(
      process.cwd(),
      'packages/crunker/test',
      './fixture/test3.wav',
    );
    const outputFilePath = path.join(outputDir, 'copy');
    const inputdata = decodeWav(await fs.promises.readFile(inputFilePath));
    await copyConcat(
      [
        { type: 'blank', duration: 2 },

        { type: 'file', filePath: inputFilePath, subtitle: { text: '' } },
      ],
      outputFilePath,
    );
    const outputdata = decodeWav(
      await fs.promises.readFile(outputFilePath + '.wav'),
    );
    expect(outputdata).ok;
    expect(inputdata.size + 384000).deep.eq(outputdata.size);
  });
  it('指定开始时间', async () => {
    const inputFilePath = path.join(
      process.cwd(),
      'packages/crunker/test',
      './fixture/test3.wav',
    );
    const outputFilePath = path.join(outputDir, 'copy');
    const inputdata = decodeWav(await fs.promises.readFile(inputFilePath));
    await copyConcat(
      [
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '', start: 2, end: 5 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '', start: 10, end: 5 },
        },
      ],
      outputFilePath,
    );
    const outputdata = decodeWav(
      await fs.promises.readFile(outputFilePath + '.wav'),
    );
    expect(outputdata).ok;
    expect(inputdata.size + 192000 * 10).deep.eq(outputdata.size);
  });
  it('start小于前面的', async () => {
    const inputFilePath = path.join(
      process.cwd(),
      'packages/crunker/test',
      './fixture/test3.wav',
    );
    const outputFilePath = path.join(outputDir, 'copy');
    const inputdata = decodeWav(await fs.promises.readFile(inputFilePath));
    await copyConcat(
      [
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '', start: 2, end: 5 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '', start: 3, end: 5 },
        },
      ],
      outputFilePath,
    );
    const outputdata = decodeWav(
      await fs.promises.readFile(outputFilePath + '.wav'),
    );
    expect(outputdata).ok;
    expect((2 + inputdata.duration * 2) * 192000).deep.eq(outputdata.size);
  });
  it('不满足条件拼接', async () => {
    const inputFilePath = path.join(
      process.cwd(),
      'packages/crunker/test',
      './fixture/test3.wav',
    );
    const outputFilePath = path.join(outputDir, 'copy');
    const inputdata = decodeWav(await fs.promises.readFile(inputFilePath));
    await copyConcat(
      [
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '', start: 2, end: 5 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '', start: 3, end: 5 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '', start: 50, end: 5 },
        },
      ],
      outputFilePath,
    );
    const outputdata = decodeWav(
      await fs.promises.readFile(outputFilePath + '.wav'),
    );
    expect(outputdata).ok;
    expect(inputdata.duration + 50).eq(outputdata.duration);
  });
  it('起始为0拼接', async () => {
    const inputFilePath = path.join(
      process.cwd(),
      'packages/crunker/test',
      './fixture/test3.wav',
    );
    const outputFilePath = path.join(outputDir, 'copy');
    const inputdata = decodeWav(await fs.promises.readFile(inputFilePath));
    await copyConcat(
      [
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '字幕1', start: 0, end: 5 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '字幕1', start: 5, end: 10 },
        },
      ],
      outputFilePath,
    );
    const outputdata = decodeWav(
      await fs.promises.readFile(outputFilePath + '.wav'),
    );
    expect(outputdata).ok;
    expect(inputdata.duration + 5).eq(outputdata.duration);
  });
  it('字幕生成', async () => {
    const inputFilePath = path.join(
      process.cwd(),
      'packages/crunker/test',
      './fixture/test3.wav',
    );
    const outputFilePath = path.join(outputDir, '/copy');
    const inputdata = decodeWav(await fs.promises.readFile(inputFilePath));
    await copyConcat(
      [
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '字幕1', start: 0, end: 5 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '字幕2', start: 5, end: 10 },
        },
      ],
      outputFilePath,
    );
    const outputdata = decodeWav(
      await fs.promises.readFile(outputFilePath + '.wav'),
    );
    expect(outputdata).ok;
    expect(inputdata.duration + 5).eq(outputdata.duration);
    expect(fs.existsSync(outputFilePath + '.srt')).true;
    const srtContent = await fs.promises.readFile(outputFilePath + '.srt', {
      encoding: 'utf-8',
    });
    const srtList = parseSync(srtContent);
    expect(srtList.length).eq(2);

    expect(srtContent).eq(`1
00:00:00,000 --> 00:00:02,645
字幕1

2
00:00:05,000 --> 00:00:07,645
字幕2`);
  });
  it('字幕生成-无时间', async () => {
    const inputFilePath = path.join(
      process.cwd(),
      'packages/crunker/test',
      './fixture/test3.wav',
    );
    const outputFilePath = path.join(outputDir, '/copy');
    const inputdata = decodeWav(await fs.promises.readFile(inputFilePath));
    await copyConcat(
      [
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '字幕1' },
        },
        {
          type: 'blank',
          duration: 2,
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '字幕2' },
        },
      ],
      outputFilePath,
    );
    const outputdata = decodeWav(
      await fs.promises.readFile(outputFilePath + '.wav'),
    );
    expect(outputdata).ok;
    expect(inputdata.duration * 2 + 2).eq(outputdata.duration);
    expect(fs.existsSync(outputFilePath + '.srt')).true;
    const srtContent = await fs.promises.readFile(outputFilePath + '.srt', {
      encoding: 'utf-8',
    });
    const srtList = parseSync(srtContent);
    expect(srtList.length).eq(2);

    expect(srtContent).eq(`1
00:00:00,000 --> 00:00:02,645
字幕1

2
00:00:04,645 --> 00:00:07,291
字幕2`);
  });

  it('变速合并', async () => {
    const inputFilePath = path.join(
      process.cwd(),
      'packages/crunker/test',
      './fixture/test3.wav',
    );
    const outputFilePath = path.join(outputDir, '/copy');
    const inputdata = decodeWav(await fs.promises.readFile(inputFilePath));
    await copyConcat(
      [
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '字幕1', start: 0, end: 1.0 },
          speedControl: {
            mode: 'nextSubtitleStart',
          },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '字幕2', start: 2, end: 3 },
          speedControl: {
            mode: 'nextSubtitleStart',
          },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          speedControl: {
            mode: 'subtitleEnd',
          },
          subtitle: { text: '字幕3', start: 4, end: 7 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          speedControl: {
            mode: 'fixed',
            ratio: 1.5,
          },
          subtitle: { text: '字幕4', start: 7, end: 10 },
        },
      ],
      outputFilePath,
    );
    const outputdata = decodeWav(
      await fs.promises.readFile(outputFilePath + '.wav'),
    );
    expect(outputdata).ok;
    expect((inputdata.duration / 1.5 + 7).toFixed(2)).eq(
      outputdata.duration.toFixed(2),
    );
    expect(fs.existsSync(outputFilePath + '.srt')).true;
    const srtContent = await fs.promises.readFile(outputFilePath + '.srt', {
      encoding: 'utf-8',
    });
    const srtList = parseSync(srtContent);
    expect(srtList.length).eq(4);
  });
  it('爆音', async () => {
    const inputFilePath = path.join(
      process.cwd(),
      'packages/crunker/test',
      './fixture/test3.wav',
    );
    const outputFilePath = path.join(outputDir, '/copy111');
    await copyConcat(
      [
        {
          type: 'file',
          filePath: inputFilePath,
          speedControl: { mode: 'fixed', ratio: 1 },
          subtitle: { text: 'xxx' },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '首先需要安装HIP 6.2', start: 4.533, end: 7.533 },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: 'zluda目前支持到6.2', start: 7.533, end: 10.533 },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '然后安装第三方的补丁', start: 11.05, end: 14.05 },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '注意选择6.2.4的补丁', start: 0.866, end: 27.866 },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          speedControl: { mode: 'fixed', ratio: 1 },
          subtitle: { text: 'xxx' },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '我这里已经覆盖完了', start: 53.883, end: 56.883 },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: {
            text: '然后选择zluda设备,并下载压缩包和模型',
            start: 73.066,
            end: 76.066,
          },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '添加一个配音音频', start: 86.266, end: 89.266 },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: {
            text: '点击右上角弹出音频面板',
            start: 92.25,
            end: 95.25,
          },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '点击文本到语音', start: 96.25, end: 99.25 },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: {
            text: '如果第一次使用zluda,这里会进行一些编译,会慢一些,理论上最慢1个小时左右',
            start: 126.466,
            end: 129.466,
          },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: { text: '生成完成', start: 148.6, end: 151.6 },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: {
            text: '速度大约为4至5秒生成一秒',
            start: 176.666,
            end: 179.666,
          },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: {
            text: '虽然速度不快,但是同价位的N卡,只能买一张卡,还有可能爆显存',
            start: 184.85,
            end: 187.85,
          },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          speedControl: { mode: 'fixed', ratio: 1 },
          subtitle: { text: 'xxx' },
        },
        {
          type: 'file',
          filePath: inputFilePath,
          subtitle: {
            text: '如果大家感兴趣的话欢迎到论坛下载,感谢大家收看,再见',
            start: 200.983,
            end: 203.983,
          },
          speedControl: { mode: 'fixed', ratio: 1 },
        },
      ],
      outputFilePath,
    );
  });
});
