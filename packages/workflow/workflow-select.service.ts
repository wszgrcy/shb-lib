import { computed, inject } from 'static-injector';
import { createNormalizeVfs, path } from '@cyia/vfs2';
import { WorkflowFileService } from './workflow-file.service';
import { Stats } from 'fs';
import { WorkflowData } from './share/handle-node';
import { WorkflowConfigToken } from './token';
export class WorkflowSelectService {
  #fileService = inject(WorkflowFileService);
  #config = inject(WorkflowConfigToken);
  #vfs = computed(() =>
    createNormalizeVfs({
      dir: this.#config().dir,
    }),
  );
  async get({ workflowName }: { workflowName: string }): Promise<WorkflowData> {
    const wfPath = path.join(this.#config().dir, `${workflowName}.workflow`);
    if (!(await this.#vfs().exists(wfPath))) {
      const isDefulat = workflowName.startsWith('default/');
      throw new Error(
        `工作流: [${workflowName}] 不存在;${isDefulat ? '您可以尝试[同步内置工作流]更新' : ''}`,
      );
    }
    const file = this.#fileService.getFile(wfPath);
    return await file.readOriginData();
  }

  async getList() {
    const rootDir = this.#config().dir;
    const list: { relPath: string; name: string; stat: Stats }[] = [];
    const listG = this.#vfs().glob('**/*.workflow', { cwd: rootDir });
    for await (const item of listG) {
      const relFilePath = item.replace(/\.workflow$/, '');
      list.push({
        relPath: relFilePath,
        name: path.basename(relFilePath),
        stat: await this.#vfs().stat(item),
      });
    }
    return list;
  }
}
