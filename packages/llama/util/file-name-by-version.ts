const SysMap: Record<string, string> = {
  win32: 'windows',
  linux: 'linux',
};
const ArchMap: Record<string, string> = {
  x64: 'amd64',
  arm64: 'arm64',
};
const ZipMap: Record<string, string> = {
  win32: 'zip',
  linux: 'tar.gz',
};
export function llamaSwapFileNameByVersion(version: string) {
  return `llama-swap_${version.slice(1)}_${SysMap[process.platform]}_${ArchMap[process.arch]}.${ZipMap[process.platform]}`;
}
const LlamaSysMap = { win32: 'win', linux: 'ubuntu' };

const LlamaPlatform = (LlamaSysMap as any)[process.platform];

export function llamaFileNameByVersion(version: string, device: string) {
  if (process.platform === 'linux' && device === 'cpu') {
    return `llama-${version}-bin-${LlamaPlatform}-x64`;
  }
  return `llama-${version}-bin-${LlamaPlatform}-${device}-x64`;
}
