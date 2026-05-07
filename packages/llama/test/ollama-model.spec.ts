import { expect } from 'chai';
import { getOllamaModel } from '../ollama-model/ollama-manifests';
import { getOllamaGgufFile } from '../download/get-ollama-gguf-file';
import { downloadFile } from '@cyia/dl';
import path from 'path';

describe('ollama原有模型', () => {
  it.skip('读取', async () => {
    const result = await getOllamaModel();
    expect(result instanceof Array).ok;
    expect(result.length).greaterThan(0);
  });
  it.skip('download', async () => {
    const result = await getOllamaGgufFile('qwen3:0.6b', {
      endpoint: 'ollama-model2.tbontop.top',
    });
    expect(result.fileList.length).eq(1);
    expect(result.fileName).not.contain(':');
    expect(result.fileName).not.contain('/');

    await downloadFile(result.fileList, {
      message: (input) => {
        console.log(input);
      },
      savePath: path.join(process.cwd(), '.tmp', 'download', 'qwen3'),
      headers: {
        'software-bbs': 'bbs.shenghuabi.site',
      },
    });
  });
});
