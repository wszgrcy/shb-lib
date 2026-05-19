import { ChatInput2, ChatInputType } from './type';
import { WorkflowNodeType } from './workflow.const';
import type { Node, ReactFlowJsonObject } from '@xyflow/react';
export type InputInvalidItem = { key: (string | number)[] };

export type InputRefItem = {
  /** 上游节点 id */
  value: string;
  /** 出口名 */
  outlet?: string;
  /** 键 */
  key: (string | number)[];
};
export type InputContextItem = {
  /** 容器节点 id */
  value: string;
  /** 上下文中提供的 */
  contextKey: string;
  /** 键 */
  key: (string | number)[];
};

export type InputItem = InputRefItem | InputInvalidItem | InputContextItem;
export interface HandleNode {
  id: string;
  /** 真正赋值使用 */
  value: string;
  /** 应该应用于tooltip显示,不应该被其他显示 */
  label: string;
  type?: 'connect';

  inputType?: ChatInputType;
  /** 是否可选,用于某些不用传入的参数 */
  optional?: boolean;
}
/** 将handle节点全部拍平 */
export function flatFilterHandleList(list: HandleNode[][] | undefined) {
  if (!list) {
    return [];
  }
  return list.flat().filter(Boolean) as HandleNode[];
}
/** 继承 handleNode */
export type ResolvedInputNode = Omit<HandleNode, 'label'> & {
  nodeId?: string;
  outputName?: string;
};
export interface WorkflowNodeData {
  value?: any;

  handle?: {
    output: HandleNode[][];
  };
  config?: {
    refList?: InputRefItem[];
    invalidList?: InputInvalidItem[];
    contextList?: InputContextItem[];
    value?: Record<string, any>;
  };
  title?: string;
  outputName?: string;
  /** 在工作流中禁止使用 @internal */
  excludeUsage?: boolean;
  [name: string]: any;
}
/** 工作流定义 */
export interface WorkflowData {
  flow: ReactFlowJsonObject<Node<WorkflowNodeData>>;
  version: number;
}
export type RawWorkflowNode = Omit<Node<WorkflowNodeData>, 'position'>;
export interface ParsedNode {
  id: string;
  type: WorkflowNodeType;
  // todo 因为加上Omit会导致类型不识别
  data: WorkflowNodeData;
  context: { id: string; output: string; rest: boolean }[];
  /** 可能是多出口 */
  outputs: HandleNode[];
  subFlowList?: { key: any; flow: ResolvedWorkflow; startId?: string }[];
}
export interface ResolvedWorkflow {
  nodes: Record<string, ParsedNode>;
  /** 出口 */
  end: string;
  inputList: ChatInput2[];
}
