import { expect } from 'chai';
import { getGgufFile } from '../download/get-gguf-file';
import { getModelManifest } from '../download/get-model-manifest';
import { autoCheckVendor } from '../download/auto-check-vendor';

describe('model', () => {
  it.skip('元数据', async () => {
    const result = await getModelManifest(
      'bartowski/Phi-3-medium-128k-instruct-GGUF:F32',
      {
        endpoint: 'https://hf-mirror.com/',
      },
    );
    // console.log(result);
  });
  it('部分切片', async () => {
    const repo = 'unsloth/Qwen3-235B-A22B-GGUF';
    const tag = 'Q8_0';
    const endpoint = 'huggingface.co';
    const result = await getGgufFile(`${repo}:${tag}`, {
      endpoint: endpoint,
    });
    const prefix = `https://${endpoint}/`;
    // 原始 https://huggingface.co/unsloth/Qwen3-235B-A22B-GGUF/resolve/main/Q8_0/Qwen3-235B-A22B-Q8_0-00002-of-00006.gguf?download=true
    expect(result.fileList).deep.eq([
      `${prefix}${repo}/resolve/main/${tag}/Qwen3-235B-A22B-Q8_0-1-of-00006.gguf`,
      `${prefix}${repo}/resolve/main/${tag}/Qwen3-235B-A22B-Q8_0-2-of-00006.gguf`,
      `${prefix}${repo}/resolve/main/${tag}/Qwen3-235B-A22B-Q8_0-3-of-00006.gguf`,
      `${prefix}${repo}/resolve/main/${tag}/Qwen3-235B-A22B-Q8_0-4-of-00006.gguf`,
      `${prefix}${repo}/resolve/main/${tag}/Qwen3-235B-A22B-Q8_0-5-of-00006.gguf`,
      `${prefix}${repo}/resolve/main/${tag}/Qwen3-235B-A22B-Q8_0-6-of-00006.gguf`,
    ]);
    // console.log(result.fileName);

    expect(result.fileName.endsWith('.gguf')).ok;
  });
  // Ollama/huggingface的镜像,貌似元数据解析都是一个
  it('gguf', async () => {
    const repo = 'wszgrcy/ChineseErrorCorrector3-4B';
    const tag = 'Q3_K_M';
    const endpoint = 'hg-model.tbontop.top';
    const result = await getGgufFile(`${repo}:${tag}`, {
      endpoint: endpoint,
    });
    expect(result.fileList.length).ok;
    expect(result.fileName.endsWith('.gguf')).ok;
  });

  it('audo check', async () => {
    let result = await autoCheckVendor('qwen3:0.6b', {
      endpoint: 'https://hg-model.tbontop.top/',
    });
    expect(result).eq('ollama');
    result = await autoCheckVendor('wszgrcy/ChineseErrorCorrector3-4B:Q3_K_M', {
      endpoint: 'https://hg-model.tbontop.top/',
    });
    expect(result).eq(undefined);
    result = await autoCheckVendor(
      'hf-mirror.com/wszgrcy/ChineseErrorCorrector3-4B:Q4_K_M',
      {
        endpoint: 'https://hg-model.tbontop.top/',
      },
    );
    expect(result).eq(undefined);
  });
});
