import { computed, signal } from 'static-injector';
import { NodeItemDefine } from '../type/type';

export class WorkflowPluginService {
  nodeList = signal<NodeItemDefine[]>([]);
  setNodeObject(obj: NodeItemDefine[]) {
    this.nodeList.set(obj);
  }

  conditionNodeList$$ = computed(() =>
    this.nodeList()
      .filter((item) => item.nodeMode === 'condition')
      .reduce(
        (obj, item) => {
          obj[item.type] = true;
          return obj;
        },
        {} as Record<string, any>,
      ),
  );
  // todo 类型
  getNodeRunner(type: string) {
    return this.nodeList().find((item) => item.type === type)!.runner;
  }
}
