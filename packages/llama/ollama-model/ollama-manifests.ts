import * as fs from 'fs';
import path from 'path';
import { MainifestType } from './manifest.type';
import { homedir } from 'os';
import normalizePath from 'normalize-path';
function getFilePath(dir: string, digest?: string) {
  return digest ? path.join(dir, digest.replace(/:/, '-')) : '';
}
async function readDirectory(
  dir: string,
  blobsDir: string,
  prefix: string,
): Promise<Record<string, any>> {
  const result: Record<string, any> = {};

  // 读取目录中的所有文件和子目录
  const files = await fs.promises.readdir(dir);

  for (const dirName of files) {
    const dirPath = path.join(dir, dirName);
    try {
      const stats = await fs.promises.stat(dirPath);
      if (stats.isDirectory()) {
        const fileList = await fs.promises.readdir(dirPath);
        for (const fileName of fileList) {
          const content = await fs.promises.readFile(
            path.join(dirPath, fileName),
            'utf8',
          );
          const data = JSON.parse(content) as MainifestType;
          const layersObj = data.layers.reduce(
            (obj, item) => {
              obj[item.mediaType.replace(/.+\.([^\.]+)$/, '$1')] = getFilePath(
                blobsDir,
                item.digest,
              );
              return obj;
            },
            {} as Record<string, string>,
          );
          result[`${prefix}${dirName}:${fileName}`] = {
            config: getFilePath(blobsDir, data.config.digest),
            ...layersObj,
          };
        }
      }
    } catch (error) {}
    // result[file];
  }

  return result;
}
export async function getOllamaModel(rootDir?: string) {
  if (!rootDir) {
    const envDir = process.env['OLLAMA_MODELS'];
    if (envDir) {
      rootDir = envDir;
    } else {
      rootDir = path.join(homedir(), '.ollama/models');
    }
  }

  const OFFICAL_LIB = normalizePath('registry.ollama.ai/library');
  const manifestsDir = path.join(rootDir, 'manifests');
  const dirExist = fs.existsSync(manifestsDir);
  if (!dirExist) {
    return [];
  }
  const blobsDir = path.join(rootDir, 'blobs');
  const list = await readDir2(manifestsDir, 2);
  let metadata = {};
  for (const item of list) {
    const relName = path.relative(manifestsDir, item);
    const prefixName = normalizePath(relName);
    const result = await readDirectory(
      item,
      blobsDir,
      prefixName === OFFICAL_LIB ? '' : `${prefixName}/`,
    );
    metadata = { ...metadata, ...result };
  }
  return Object.entries(metadata).map(([key, value]) => ({
    name: key,
    value: (value as any).model as string,
  }));
}

async function readDir2(dir: string, level: number): Promise<string[]> {
  if (level === 0) {
    return [dir];
  }
  const list = await fs.promises.readdir(dir);
  return Promise.all(
    list.map((item) => readDir2(path.join(dir, item), level - 1)),
  ).then((list) => list.flat());
}
