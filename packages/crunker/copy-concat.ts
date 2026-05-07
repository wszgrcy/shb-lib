import fs, { ReadStream } from 'fs';
import { Transform, Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { decodeWav, encodeWav } from './wav-decode';
import path from 'path';
import { timeToStr } from './util';
import { changeSpeedForFile } from './speed';
import type { SpeedControlType } from './define';

function createBlankStream(count: number) {
  const highWaterMark = 8 * 1024 * 1024;
  return Readable.from(
    (function* () {
      while (count > 0) {
        const chunkSize = Math.min(highWaterMark, count);
        yield Buffer.alloc(chunkSize, 0);
        count -= chunkSize;
      }
    })(),
    { highWaterMark },
  );
}
export interface FileChunk {
  type: 'file';
  filePath: string;
  subtitle: { text: string; start?: number; end?: number };
  /** 第一次处理 */
  speedControl?: SpeedControlType;
}
export interface BlankChunk {
  type: 'blank';
  duration: number;
}
export type ContactType = FileChunk | BlankChunk;

function getSecondsLength(
  seconds: number,
  sampleRate: number,
  channels: number,
  bitDepth: number,
) {
  return Math.round(seconds * sampleRate) * channels * (bitDepth >> 3);
}
/** wav头文件+data复制 */
export async function copyConcat(list: ContactType[], output: string) {
  const outputDir = path.dirname(output);
  await fs.promises.mkdir(outputDir, { recursive: true });
  const parsedList = await Promise.all(
    list
      .filter((item) => item.type === 'file')
      .map((item) =>
        readWavHeader(item.filePath).then((buffer) => decodeWav(buffer)),
      ),
  );
  /** 开始的持续时间 */
  let startSecond = 0;
  /** 文件索引 */
  let fileIndex = 0;
  const subtitleList: string[] = [];
  const changedList = list.slice();
  for (let index = 0; index < changedList.length; index++) {
    const item = changedList[index];
    if (item.type === 'file') {
      const currentIndex = fileIndex++;
      let fileResolved = parsedList[currentIndex];
      if (item.speedControl) {
        let ratio = 1;
        switch (item.speedControl.mode) {
          case 'fixed': {
            ratio = item.speedControl!.ratio ?? 1;
            break;
          }
          case 'nextSubtitleStart': {
            if (
              !(index + 1 < changedList.length) ||
              !('start' in item.subtitle)
            ) {
              break;
            }
            const nextItem = changedList[index + 1] as FileChunk;
            const rDuration =
              nextItem.subtitle.start! -
              item.subtitle.start! -
              (item.speedControl?.minInterval ?? 0);
            ratio = Math.min(
              item.speedControl!.ratio ?? 999,
              fileResolved.duration / rDuration,
            );
            break;
          }
          case 'subtitleEnd': {
            if (!('start' in item.subtitle)) {
              break;
            }
            const rDuration =
              item.subtitle.end! -
              item.subtitle.start! -
              (item.speedControl?.minInterval ?? 0);
            ratio = Math.min(
              item.speedControl!.ratio ?? 999,
              fileResolved.duration / rDuration,
            );
            break;
          }
          default:
        }
        if (ratio > 1) {
          const result = await changeSpeedForFile(item.filePath, ratio);
          parsedList[currentIndex] = result.info;
          fileResolved = result.info;
          item.filePath = result.filePath;
        }
      }

      if (typeof item.subtitle?.start === 'number') {
        const preDuration = item.subtitle.start - startSecond;
        if (preDuration > 0) {
          changedList.splice(index, 0, {
            type: 'blank',
            duration: preDuration,
          });
          startSecond = item.subtitle.start + fileResolved.duration;
          index++;
        } else {
          startSecond += fileResolved.duration;
        }
      } else {
        startSecond += fileResolved.duration;
      }
      if (item.subtitle) {
        subtitleList.push(
          [
            `${subtitleList.length + 1}`,
            `${timeToStr(startSecond - fileResolved.duration)} --> ${timeToStr(startSecond)}`,
            item.subtitle.text,
          ].join('\n'),
        );
      }
    } else if (item.type === 'blank') {
      startSecond += item.duration;
    }
  }

  const data = parsedList[0]!;
  fileIndex = 0;
  /** 长度 */
  let dataLength = 0;
  // 计算总长度
  for (let index = 0; index < changedList.length; index++) {
    const item = changedList[index];
    if (item.type === 'file') {
      dataLength += parsedList[fileIndex++].size;
    } else if (item.type === 'blank') {
      dataLength += getSecondsLength(
        item.duration,
        data.fmt.sampleRate,
        data.fmt.channels,
        data.fmt.bitDepth,
      );
    }
  }
  //头数据生成
  const headBuffer = encodeWav({
    channels: data.fmt.channels,
    sampleRate: data.fmt.sampleRate,
    floatingPoint: data.fmt.floatingPoint,
    bitDepth: data.fmt.bitDepth,
    dataLength: dataLength,
  });
  const wavPath = output + '.wav';
  await pipeline(
    ReadStream.from(Buffer.from(headBuffer)),
    fs.createWriteStream(wavPath),
  );
  for (let index = 0; index < changedList.length; index++) {
    const item = changedList[index];
    if (item.type === 'file') {
      const outputWriteStream = fs.createWriteStream(wavPath, {
        flags: 'a',
      });
      const readStream = fs.createReadStream(item.filePath);
      let isSkip = false;
      await pipeline(
        readStream,
        new Transform({
          transform(chunk, encoding, callback) {
            if (!isSkip) {
              const result = decodeWav(chunk);
              callback(null, chunk.subarray(result?.pos));
              isSkip = true;
            } else {
              callback(null, chunk);
            }
          },
        }),
        outputWriteStream,
      );
    } else if (item.type === 'blank') {
      const size = getSecondsLength(
        item.duration,
        data.fmt.sampleRate,
        data.fmt.channels,
        data.fmt.bitDepth,
      );
      await pipeline(
        createBlankStream(size),
        fs.createWriteStream(wavPath, {
          flags: 'a',
        }),
      );
    }
  }
  await fs.promises.writeFile(output + '.srt', subtitleList.join('\n\n'));
}

async function readWavHeader(filePath: string) {
  const fd = await new Promise<number>((resolve, reject) => {
    fs.open(filePath, 'r', (err, fd) => {
      if (err) {
        return reject(err);
      }
      resolve(fd);
    });
  });
  const headerLength = 200;
  return new Promise<Buffer>((resolve, reject) => {
    fs.read(
      fd,
      Buffer.alloc(headerLength),
      0,
      headerLength,
      0,
      (err, bytesRead, buffer) => {
        if (err) {
          fs.close(fd, () => {
            reject(err);
          });
          return;
        }

        fs.close(fd, (err) => {
          if (!err) {
            resolve(buffer);
          } else {
            reject(err);
          }
        });
      },
    );
  });
}
