import { getModelManifest, parseName } from './get-model-manifest';
import MS from 'magic-string';
export async function getGgufFile(
  name: string,
  options: {
    endpoint: string;
    token?: string;
    fileName?: string;
  },
) {
  const resultUrl = parseName(name);
  const endpoint = resultUrl.endpoint ?? `https://${options.endpoint}/`;
  const hff = `${resultUrl.namespace}/${resultUrl.repo}`;
  const result = await getModelManifest(name, {
    ...options,
    endpoint: `https://${options.endpoint}/`,
  });
  const rfilename = result.ggufFile.rfilename;
  const result2 = getGgufSplitPartsInfo(rfilename);

  if (options?.fileName) {
    const fileList = [`${endpoint}${hff}/resolve/main/${options.fileName}`];
    return {
      fileList: fileList,
      fileName: `${hff}-${options.fileName}`.replace(/\//g, '-'),
    };
  }
  const fileList = result2.map(
    (item) => `${endpoint}${hff}/resolve/main/${item}`,
  );
  return {
    fileList: fileList,
    fileName: `${hff}-${result2[0]}`.replace(/\//g, '-'),
  };
}
// export function isUrl(text: string, throwOnInvalidUrl: boolean = true) {
//   if (
//     text.toLowerCase().startsWith('http://') ||
//     text.toLowerCase().startsWith('https://')
//   ) {
//     try {
//       new URL(text);
//       return true;
//     } catch {
//       if (throwOnInvalidUrl) throw new Error(`Invalid URL: ${text}`);

//       return false;
//     }
//   }

//   return false;
// }

const splitGgufPartRegex = /-(?<part>\d{5})-of-(?<parts>\d{5})\.gguf$/d;
export function getGgufSplitPartsInfo(ggufPath: string) {
  const checkPath = ggufPath;

  const splitPartMatch = checkPath.match(splitGgufPartRegex);
  if (splitPartMatch != null) {
    const part = +splitPartMatch.groups!.part;
    const parts = +splitPartMatch.groups!.parts;
    const list = [];
    for (let i = part; i <= parts; i++) {
      const ms = new MS(checkPath);
      const partIndex = splitPartMatch.indices!.groups!['part'];
      ms.update(partIndex[0], partIndex[1], `${i}`);
      list.push(ms.toString());
    }
    return list;
  } else {
    return [checkPath];
  }
}
