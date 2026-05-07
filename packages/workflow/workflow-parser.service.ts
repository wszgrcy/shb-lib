import {
  computed,
  createInjector,
  inject,
  InjectionToken,
  Injector,
} from 'static-injector';

import Graph from 'graphology';
import {
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  Node,
} from '@xyflow/react';
import { WorkflowNodeType } from './share/workflow.const';
import { uniqBy } from 'es-toolkit';
// 自定义可拓展

import {
  flatFilterHandleList,
  HandleNode,
  ResolvedWorkflow,
  WorkflowData,
  WorkflowNodeData,
} from './share/handle-node';
import { InlineNodeService } from './inline/inline.service';
import { WorkflowPluginService } from './plugin/plugin.service';
import * as InlineNodeObj from './inline/node/index.node';
export interface ResolvedWorkflowResult {
  data?: ResolvedWorkflow;
  /** todo 应该更详细，进行错误定位 */
  error?: {
    message?: string;
    nodeId?: string;
  };
  manualInput?: boolean;
}
type SubGroupList = Record<
  string,
  { key: string; startId?: string; nodeList: Node<WorkflowNodeData>[] }[]
>;
class WorkflowParserContext {
  // fixme 或许可以分离，单独调用，然后加上children查找，不过那样就太慢了
  #childUseNodeSet = new Set<string>();

  constructor(
    /** 主列表或者说某一级的列表 */
    public list: Node<WorkflowNodeData>[],
    private subObject: SubGroupList,
    private data: Pick<WorkflowData, 'flow'>,
    /** 父级节点 */
    private parentNode?: Node<WorkflowNodeData>,
    /** inputList 使用,全局统计 */
    private userInputParams: HandleNode[] = [],
    /** 父级上下文 */
    private parent?: WorkflowParserContext,
  ) {}
  /** 只能子级在本级找不到节点时调用父级使用 */
  protected childUseDefine(
    id: string,
    parentId?: string,
  ): Node<WorkflowNodeData> | undefined {
    const define = this.list.find((item) => item.id === id);
    if (!define) {
      return this.parent?.childUseDefine(id, parentId);
    }
    if (id !== parentId) {
      this.#childUseNodeSet.add(id);
    }
    return define;
  }
  #getParentNodeDefine(id: string) {
    return this.parent?.childUseDefine(id, this.parentNode?.id);
  }
  parseItem(): ResolvedWorkflowResult {
    const graph = new Graph({ multi: true });
    const { nodes, edges } = this.data.flow;
    const nodeData: ResolvedWorkflow = { nodes: {}, end: undefined } as any;
    this.list.forEach((node) => {
      graph.addNode(node.id);
    });
    for (const node of this.list) {
      const handle = {
        output: flatFilterHandleList(node.data.handle?.output),
      };
      /** 连接的所有边,包括input+output */
      const cEdges = getConnectedEdges([node], edges);
      /** 输入连接点,可以理解为参数 */
      const inputNodes = getIncomers(node, nodes, cEdges);
      /** 定义输入，大于等于边，因为可能有没连接的 */
      const inputHandleList = flatFilterHandleList(node.data.handle?.input);
      /** 保存的是handle和对应的nodeid? */
      const inputParams = [];
      // 其实就是找依赖,以及确定输入
      for (const item of inputHandleList) {
        const targetHandle = item.id;
        /** 连接到当前节点的边 */
        const linkedEdges = cEdges.filter(
          (item) =>
            item.targetHandle === targetHandle && item.target === node.id,
        );
        // 未来可以改成多个节点就变成数组?
        if (linkedEdges.length > 1) {
          return {
            error: {
              message: `${node.id}:不支持多个节点连接一个输入点`,
              nodeId: node.id,
            },
          };
        }
        if (linkedEdges.length === 1) {
          const linkedEdge = linkedEdges[0];
          /** 找到连接的输入节点 */
          const linkedNode = inputNodes.find(
            (item) => item.id === linkedEdge.source,
          )!;
          const linkedOuput = flatFilterHandleList(
            linkedNode.data.handle?.output,
          ).find((item) => item.id === linkedEdge.sourceHandle);

          inputParams.push({
            ...item,
            nodeId: linkedNode.id,
            outputName: linkedOuput!.value,
          });
          //这个节点只能是当前或者说是它的祖先提供,不能是其他的地方的
          if (!graph.hasNode(linkedNode.id)) {
            // 只允许在父级查找
            if (!this.#getParentNodeDefine(linkedNode.id)) {
              return {
                error: {
                  message: `${linkedNode.id}:未找到连接节点,只能读取到当前及祖先范围内的节点`,
                  nodeId: linkedNode.id,
                },
              };
            }
            graph.addNode(linkedNode.id);
          }
          graph.addEdge(linkedNode.id, node.id);
        } else {
          // 没有输入节点就需要统计
          inputParams.push({ ...item });
          // 过滤连接点
          if (item.type) {
            continue;
          }
          this.userInputParams.push(item);
        }
      }
      nodeData.nodes[node.id] = {
        data: node.data,
        //输入用
        inputs: inputParams,
        outputs: handle.output,
        type: node.type! as any,
        id: node.id,
      };
      // 如果这个节点是一个块级节点
      if (this.subObject[node.id]) {
        // 多出口
        for (let index = 0; index < this.subObject[node.id].length; index++) {
          const { key, startId, nodeList } = this.subObject[node.id][index];
          const instance = new WorkflowParserContext(
            nodeList,
            this.subObject,
            this.data,
            node,
            this.userInputParams,
            this,
          );
          const result = instance.parseItem();
          if (result.error) {
            return { error: { ...result.error } };
          }
          nodeData.nodes[node.id].subFlowList ??= [];
          // todo 一个输出只能有一个连接?
          nodeData.nodes[node.id].subFlowList!.push({
            key: key,
            flow: result.data!,
            startId: startId,
          });
        }
      }
    }
    const outList: string[] = [];
    graph.forEachNode((node) => {
      // 排除自己使用过的节点和有输出连接的的节点
      if (!this.#childUseNodeSet.has(node) && graph.outDegree(node) === 0) {
        outList.push(node);
      }
    });
    if (outList.length > 1) {
      return { error: { message: `计算时存在多个出口` } };
    } else if (outList.length === 0) {
      return { error: { message: `可能出现循环依赖,没有出口` } };
    } else {
      nodeData.end = outList[0];
      nodeData.inputList = uniqBy(
        this.userInputParams,
        (item) => `${item.inputType || 'string'}|${item.value}`,
      ).map((item) => ({
        inputType: item.inputType || 'string',
        value: item.value,
        label: item.label || item.value,
        optional: item.optional,
      }));
      return { data: nodeData };
    }
  }
}
class NodeGroup {
  #group = new Map<string, Node<WorkflowNodeData>[]>();
  #iterationMap = new Map<string, Node<WorkflowNodeData>>();
  addContainerStart(node: Node<WorkflowNodeData>) {
    this.#iterationMap.set(node.parentId!, node);
  }
  getContainerStart(node: Node<WorkflowNodeData>) {
    return this.#iterationMap.get(node.id)!;
  }
  add(node: Node<WorkflowNodeData>) {
    const nodeMap = this.#group.get(node.type! as any) || [];
    nodeMap.push(node);
    this.#group.set(node.type! as any, nodeMap);
  }
  getList(type: string) {
    return this.#group.get(type) || [];
  }
}
const WorkflowDataToken = new InjectionToken<Pick<WorkflowData, 'flow'>>(
  'WorkflowData',
);
/** 预解析,确定范围 */
class WorkflowPreParser {
  /**
   * 迭代块：直接找父级parentid就行了
   * 分类块：所有后面的都算他的
   * 重构，所有节点进行迭代
   * 找迭代快，找到后找子级item块，找到后进行output查找+parent==迭代快
   * 找分类，找到后output查找
   * 所有独立块都是找到独立节点后终止
   */
  #nodeGroup = new NodeGroup();
  #data = inject(WorkflowDataToken);
  #plugin = inject(WorkflowPluginService);
  #inlineNodeService = inject(InlineNodeService);

  #fullBlockObject$$ = computed(
    () =>
      ({
        ...this.#inlineNodeService.conditionNodeList(),
        ...this.#plugin.conditionNodeList$$(),
        [WorkflowNodeType.iteration]: true,
      }) as Record<string, boolean>,
  );
  #conditionBlockObject$$ = computed(
    () =>
      ({
        ...this.#inlineNodeService.conditionNodeList(),
        ...this.#plugin.conditionNodeList$$(),
      }) as Record<string, boolean>,
  );

  parse() {
    const { nodes, edges } = this.#data.flow;
    /** 迭代块内部的 */
    const mainList = [];
    /** 节点的多出口 */
    const subObjectGroup: SubGroupList = {};
    const excludeSet = new Set<string>();
    /** 判断节点是否是块级 */
    const isBlock = (item: Node<WorkflowNodeData>) =>
      this.#fullBlockObject$$()[item.type!];
    const removedList = new Set<string>();
    const getSubNode = (
      node: Node<WorkflowNodeData>,
      subNodeList: Node<WorkflowNodeData>[],
    ) => {
      subNodeList.push(node);
      excludeSet.add(node.id);
      if (!isBlock(node)) {
        getOutgoers(node, nodes, edges).forEach((item) => {
          getSubNode(item, subNodeList);
        });
      }
    };
    let manualInput = false;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.data.excludeUsage) {
        removedList.add(node.id);
        nodes.splice(i, 1);
        i--;
        continue;
      }
      if (node.type === 'input-params') {
        manualInput ||= !!node.data.config?.['manualInput'];
      } else if (isBlock(node)) {
        this.#nodeGroup.add(node);
      } else if (node.type === WorkflowNodeType.iterationStart) {
        this.#nodeGroup.addContainerStart(node);
      }
    }

    Object.keys(this.#fullBlockObject$$())
      .flatMap((key) => this.#nodeGroup.getList(key))
      .forEach((node) => {
        const outputList = subObjectGroup[node.id] || [];
        subObjectGroup[node.id] = outputList;
        // 这个是包裹级块
        if (node.type === WorkflowNodeType.iteration) {
          const subNodeList: Node<WorkflowNodeData>[] = [];
          const startNode = this.#nodeGroup.getContainerStart(node);
          getSubNode(startNode, subNodeList);
          outputList.push({
            nodeList: uniqBy(subNodeList, (item) => item.id),
            startId: startNode.id,
            key: `[default]`,
          });
        }
        // 这个是分支级块
        else if (this.#conditionBlockObject$$()[node.type!]) {
          const cEdges = getConnectedEdges([node], edges);
          const children = getOutgoers(node, nodes, cEdges);
          const outputHandleList = flatFilterHandleList(
            node.data.handle!.output,
          );
          for (const outputHandle of outputHandleList) {
            // 一个出口可能被多次使用
            const outputEdgeList = cEdges.filter(
              (edge) => edge.sourceHandle === outputHandle.id,
            );

            if (!outputEdgeList.length) {
              throw new Error(`[${node.data.title || ''}]节点上发现未连接出口`);
            }
            for (const childNode of children.filter(({ id }) =>
              outputEdgeList.some(({ target }) => target === id),
            )) {
              const subNodeList: Node<WorkflowNodeData>[] = [];
              getSubNode(childNode, subNodeList);
              outputList.push({
                nodeList: uniqBy(subNodeList, (item) => item.id),
                startId: childNode.id,
                key: outputHandle.value,
              });
            }
          }
        }
      });

    for (const node of nodes) {
      if (excludeSet.has(node.id)) {
        continue;
      }
      mainList.push(node);
    }

    return {
      list: mainList,
      subObjectGroup,
      manualInput,
      edges: edges.filter(
        (edge) =>
          !removedList.has(edge.source) && !removedList.has(edge.target),
      ),
    };
  }
}
/** 先将图解析为定义 */
export class WorkflowParserService {
  #injector = inject(Injector);
  #inlineNode = inject(InlineNodeService);
  constructor() {
    this.#inlineNode.register(InlineNodeObj);
  }
  /**
   * 1.如果出现孤立节点，那么需要判断是不是子级引用
   * 2.子级引用本级别找不到，那么需要找父级
   */
  /**
   * 边有id,通过source 找到连接的节点
   *
   */
  parse(data: Pick<WorkflowData, 'flow'>): ResolvedWorkflowResult {
    const injector = createInjector({
      providers: [
        WorkflowPreParser,
        { provide: WorkflowDataToken, useValue: data },
      ],
      parent: this.#injector,
    });
    const preInstance = injector.get(WorkflowPreParser);

    const result = preInstance.parse();
    if (!result.list.length) {
      return {
        error: {
          message: '无可用节点',
        },
      };
    }
    const instance = new WorkflowParserContext(
      result.list,
      result.subObjectGroup,
      { ...data, flow: { ...data.flow, edges: result.edges } },
    );
    return { ...instance.parseItem(), manualInput: result.manualInput };
  }
}
// 改成多出口,但是需要看看多出口有什么隐藏的问题
