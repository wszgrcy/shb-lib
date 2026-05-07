import AudioBuffer from 'audio-buffer';

type DecodeFn = (
  buffer: any,
  offset: number,
  output: Float32Array<ArrayBuffer>[],
  channels: number,
  samples: number,
) => void;
type DecodeMap = {
  pcm8: DecodeFn;
  pcm16: DecodeFn;
  pcm24: DecodeFn;
  pcm32: DecodeFn;
  pcm32f: DecodeFn;
  pcm64f: DecodeFn;
};
const data_decoders: DecodeMap = {
  pcm8: (buffer, offset, output, channels, samples) => {
    const input = new Uint8Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        const data = input[pos++] - 128;
        output[ch][i] = data < 0 ? data / 128 : data / 127;
      }
    }
  },
  pcm16: (buffer, offset, output, channels, samples) => {
    const input = new Int16Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        const data = input[pos++];
        output[ch][i] = data < 0 ? data / 32768 : data / 32767;
      }
    }
  },
  pcm24: (buffer, offset, output, channels, samples) => {
    const input = new Uint8Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        const x0 = input[pos++];
        const x1 = input[pos++];
        const x2 = input[pos++];
        const xx = x0 + (x1 << 8) + (x2 << 16);
        const data = xx > 0x800000 ? xx - 0x1000000 : xx;
        output[ch][i] = data < 0 ? data / 8388608 : data / 8388607;
      }
    }
  },
  pcm32: (buffer, offset, output, channels, samples) => {
    const input = new Int32Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        const data = input[pos++];
        output[ch][i] = data < 0 ? data / 2147483648 : data / 2147483647;
      }
    }
  },
  pcm32f: (buffer, offset, output, channels, samples) => {
    const input = new Float32Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) output[ch][i] = input[pos++];
    }
  },
  pcm64f: (buffer, offset, output, channels, samples) => {
    const input = new Float64Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) output[ch][i] = input[pos++];
    }
  },
};
function lookup(table: DecodeMap, bitDepth: number, floatingPoint: boolean) {
  const name = 'pcm' + bitDepth + (floatingPoint ? 'f' : '');
  const fn = (table as any)[name] as DecodeFn;
  if (!fn) throw new TypeError('Unsupported data format: ' + name);
  return fn;
}
export function decodeWav(buffer: Buffer | Uint8Array) {
  let pos = 0,
    end = 0;
  if (buffer.buffer) {
    // If we are handed a typed array or a buffer, then we have to consider the
    // offset and length into the underlying array buffer.
    pos = buffer.byteOffset;
    end = buffer.length;
    buffer = buffer.buffer as any;
  } else {
    // If we are handed a straight up array buffer, start at offset 0 and use
    // the full length of the buffer.
    pos = 0;
    end = buffer.byteLength;
  }

  const v = new DataView(buffer as any);

  function u8() {
    const x = v.getUint8(pos);
    pos++;
    return x;
  }

  function u16() {
    const x = v.getUint16(pos, true);
    pos += 2;
    return x;
  }

  function u32() {
    const x = v.getUint32(pos, true);
    pos += 4;
    return x;
  }

  function string(len: number) {
    let str = '';
    for (let i = 0; i < len; ++i) str += String.fromCharCode(u8());
    return str;
  }

  if (string(4) !== 'RIFF') throw new TypeError('Invalid WAV file');
  u32();
  if (string(4) !== 'WAVE') throw new TypeError('Invalid WAV file');

  let fmt;

  while (pos < end) {
    const type = string(4);
    const size = u32();
    const next = pos + size;
    switch (type) {
      case 'fmt ': {
        const formatId = u16();
        if (formatId !== 0x0001 && formatId !== 0x0003 && formatId !== 0xfffe)
          throw new TypeError(
            `Unsupported format in WAV file: ${formatId.toString(16)}`,
          );
        fmt = {
          format: 'lpcm',
          floatingPoint: formatId === 0x0003,
          channels: u16(),
          sampleRate: u32(),
          byteRate: u32(),
          blockSize: u16(),
          bitDepth: u16(),
        };
        break;
      }
      case 'data': {
        if (!fmt) throw new TypeError('Missing "fmt " chunk.');
        const samples = Math.floor(size / fmt.blockSize);
        const channels = fmt.channels;
        const sampleRate = fmt.sampleRate;

        return {
          sampleRate: sampleRate,
          fmt,
          samples,
          channels,
          pos,
          size,
          duration: size / sampleRate / channels / (fmt.bitDepth >> 3),
        };
      }
    }
    pos = next;
  }
  throw new Error('error parse');
}
type WavData = ReturnType<typeof decodeWav>;
export function createBuffer({
  channelData,
  sampleRate,
}: {
  channelData: readonly Float32Array[];
  sampleRate: number;
}) {
  const audioBuffer = new AudioBuffer({
    sampleRate,
    length: channelData[0].length,
    numberOfChannels: channelData.length,
  });
  for (let ch = 0; ch < channelData.length; ch++)
    audioBuffer.getChannelData(ch).set(channelData[ch]);
  return audioBuffer;
}
export function parseAudioBufferByInfo(info: WavData, buffer: Uint8Array) {
  const channelData = [];
  const channels = info.channels;
  const samples = info.samples;
  for (let ch = 0; ch < channels; ++ch)
    channelData[ch] = new Float32Array(samples);
  lookup(data_decoders, info.fmt.bitDepth, info.fmt.floatingPoint)(
    buffer.buffer,
    info.pos,
    channelData,
    info.fmt.channels,
    info.samples,
  );
  return createBuffer({ channelData, sampleRate: info.fmt.sampleRate });
}

export function encodeWav(opts: {
  channels: number;
  sampleRate?: number;
  floatingPoint?: boolean;
  bitDepth: number;
  dataLength: number;
}) {
  const sampleRate = opts.sampleRate || 16000;
  const floatingPoint = !!opts.floatingPoint;
  const bitDepth = floatingPoint ? 32 : opts.bitDepth | 0 || 16;
  const channels = opts.channels;
  const buffer = new ArrayBuffer(44);

  const v = new DataView(buffer);
  let pos = 0;

  function u8(x: number) {
    v.setUint8(pos++, x);
  }

  function u16(x: number) {
    v.setUint16(pos, x, true);
    pos += 2;
  }

  function u32(x: number) {
    v.setUint32(pos, x, true);
    pos += 4;
  }

  function string(s: string) {
    for (let i = 0; i < s.length; ++i) u8(s.charCodeAt(i));
  }

  // write header
  string('RIFF');
  u32(opts.dataLength + 36);
  string('WAVE');

  // write 'fmt ' chunk
  string('fmt ');
  u32(16);
  u16(floatingPoint ? 0x0003 : 0x0001);
  u16(channels);
  u32(sampleRate);
  u32(sampleRate * channels * (bitDepth >> 3));
  u16(channels * (bitDepth >> 3));
  u16(bitDepth);

  // write 'data' chunk
  string('data');
  u32(opts.dataLength);

  return buffer;
}
