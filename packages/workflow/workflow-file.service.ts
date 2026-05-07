import { inject } from 'static-injector';
// 一块迁移
import { path } from '@cyia/vfs2';
// 注入
import { WorkflowData } from './share/handle-node';
import { WorkflowConfigToken } from './token';
import { RawFile } from '@cyia/bundle-file';
/** 工作流文件 */
export class WorkflowFileService {
  #config = inject(WorkflowConfigToken);
  #fileMap = new Map<string, RawFile>();

  getFile(filePath: string) {
    const nFilePath = path.normalize(filePath);
    let file = this.#fileMap.get(nFilePath);
    if (!file) {
      file = new RawFile<WorkflowData>(nFilePath);
      this.#fileMap.set(nFilePath, file);
    }
    return file;
  }
  /** 关闭已打开的默认工作流文件 */
  async closeDefulatFile() {
    // 注入目录
    const dir = path.join(this.#config().dir, 'default');
    for (const [filePath, file] of this.#fileMap) {
      if (filePath.startsWith(dir)) {
        await file.close();
        this.#fileMap.delete(filePath);
      }
    }
  }
  async remove(filePath: string) {
    const nFilePath = path.normalize(filePath);
    const file = this.#fileMap.get(nFilePath);
    if (!file) {
      return;
    }
    await file.close();
    this.#fileMap.delete(nFilePath);
  }
}
