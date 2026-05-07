import { Kali } from './kali';
import { createBuffer, decodeWav } from './wav-decode';
import fs from 'fs';
import { decode } from 'node-wav';
import { Crunker } from './crunker';
function doStretch(
  inputData: Float32Array,
  stretchFactor: number,
  numChannels: number = 1,
  sampleRate: number,
): Float32Array {
  const numInputFrames = inputData.length / numChannels;
  const bufsize = 4096 * numChannels;

  // Create a Kali instance and initialize it
  const kali = new Kali(numChannels);
  kali.setup(sampleRate, stretchFactor);

  // Create an array for the stretched output. Note if the rate is changing, this array won't be completely full
  const completed = new Float32Array(
    Math.floor((numInputFrames / stretchFactor) * numChannels + 1),
  );

  let inputOffset = 0;
  let completedOffset = 0;
  let flushed = false;

  while (completedOffset < completed.length && inputOffset < inputData.length) {
    // Read stretched samples into our output array
    completedOffset += kali.output(
      completed.subarray(
        completedOffset,
        Math.min(completedOffset + bufsize, completed.length),
      ),
    );

    if (inputOffset < inputData.length) {
      // If we have more data to write, write it
      const dataToInput = inputData.subarray(
        inputOffset,
        Math.min(inputOffset + bufsize, inputData.length),
      );
      inputOffset += dataToInput.length;

      // Feed Kali samples
      kali.input(dataToInput);
      kali.process();
    } else if (!flushed) {
      // Flush if we haven't already
      kali.flush();
      flushed = true;
    }
  }

  return completed;
}

function changeSpeed(decodeData: ReturnType<typeof decode>, ratio: number) {
  const channelData = [];
  for (const item of decodeData.channelData) {
    const result = doStretch(item, ratio, 1, decodeData.sampleRate);
    channelData.push(result);
  }

  return createBuffer({ channelData, sampleRate: decodeData.sampleRate });
}

export async function changeSpeedForFile(filePath: string, speed: number) {
  const buffer = await fs.promises.readFile(filePath);
  const decodeResult = decode(buffer);
  const changedBuffer = changeSpeed(decodeResult, speed);
  const instance = new Crunker({ sampleRate: changedBuffer.sampleRate });
  const filePath2 = filePath.replace(
    /.(\w+)$/,
    `_${(speed * 100).toFixed(0)}.$1`,
  );
  const buffer2 = instance.export(changedBuffer);
  await fs.promises.writeFile(filePath2, buffer2);
  return { info: decodeWav(buffer2), filePath: filePath2 };
}
