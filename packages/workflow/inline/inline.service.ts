import { NodeItemDefine } from '../type/type';

export class InlineNodeService {
  inlineList: NodeItemDefine[] = [];
  register(obj: Record<string, NodeItemDefine>) {
    Object.values(obj).forEach((item) => {
      this.inlineList.push(item);
    });
  }
  getInlineList() {
    return this.inlineList;
  }
  conditionNodeList() {
    return this.inlineList
      .filter((item) => item.nodeMode === 'condition')
      .reduce(
        (obj, item) => {
          obj[item.type] = true;
          return obj;
        },
        {} as Record<string, boolean>,
      );
  }
  // todo 类型
  getNodeRunner(type: string) {
    return this.inlineList.find((item) => item.type === type)?.runner;
  }
  getNodeDefine(type: string) {
    return this.inlineList.find((item) => item.type === type);
  }
}
