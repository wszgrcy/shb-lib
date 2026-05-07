import path from 'node:path';

export function parseName(name: string) {
  const parts = name.replace(path.sep, '/').split('/');
  const fn = () => {
    switch (parts.length) {
      case 3: {
        let endpoint = parts[0];
        if (!endpoint.includes('://')) {
          endpoint = `https://${endpoint}`;
        }
        if (!endpoint.endsWith('/')) {
          endpoint = `${endpoint}/`;
        }
        return {
          endpoint: endpoint,
          namespace: parts[1],
          repo: parts[2],
        };
      }
      case 2:
        return {
          namespace: parts[0],
          repo: parts[1],
        };
    }
    throw new Error(`parse url failed: ${name}`);
  };
  const result = fn();

  const list = result.repo.split(':');
  return {
    ...result,
    repo: list[0],
    tag: list[1],
  };
}

export async function getModelManifest(
  name: string,
  options: {
    endpoint: string;
    token?: string;
  },
) {
  const result = parseName(name);
  const endpointList = [result.endpoint, options.endpoint].filter(Boolean);
  let lastError;
  // 因为hf-mirror似乎有问题,所以加入两个镜像验证,一个是url带的,一个是传入
  for (const endpoint of endpointList) {
    const manifestUrl = `${endpoint}v2/${result.namespace}/${result.repo}/manifests/${result.tag || 'latest'}`;
    const headers = {
      'User-Agent': 'llama-cpp',
      'software-bbs': 'bbs.shenghuabi.site',
    } as any;
    if (options?.token) {
      headers['Authorization'] = `Bearer ` + options.token;
    }
    try {
      const result = await fetch(manifestUrl, {
        headers,
      }).then(async (response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(
          `${response.status}:${response.statusText ?? (await response.text())}`,
        );
      });
      return result as { layers: any[]; ggufFile: any };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
