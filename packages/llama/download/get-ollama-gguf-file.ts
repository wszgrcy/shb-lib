import { getModelManifest, parseName } from './get-model-manifest';
//https://registry.ollama.ai/v2/library/qwen3/manifests/latest
function getDownloadFileName(name: string) {
  return name;
}
export async function getOllamaGgufFile(
  name: string,
  options: {
    endpoint: string;
    token?: string;
  },
) {
  name = name.includes('/') ? name : `library/${name}`;
  const resultUrl = parseName(name);
  const endpoint = resultUrl.endpoint ?? `https://${options.endpoint}/`;
  const hff = `${resultUrl.namespace}/${resultUrl.repo}`;
  const result = await getModelManifest(name, {
    ...options,
    endpoint: endpoint,
  });
  const rfilename = result.layers.find(
    (item: any) => item.mediaType === `application/vnd.ollama.image.model`,
  ).digest;
  const result2 = getDownloadFileName(rfilename);

  const fileList = [`${endpoint}v2/${hff}/blobs/${result2}`];
  return {
    fileList: fileList,
    fileName: `ollama-${name}`.replace(/\/|:/g, '-'),
  };
}
