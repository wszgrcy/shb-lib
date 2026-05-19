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
// todo 优化
export interface HandleNode {
  /** 唯一,用来查询 */
  id: string;
  /** 一般表示key */
  name: string;
  /** 应该应用于tooltip显示,不应该被其他显示 */
  label?: string;
  type?: 'connect' | (string & {});
  /** todo */
  validateType?: ChatInputType[];
}
/** 将handle节点全部拍平 */
export function flatFilterHandleList(list: HandleNode[][] | undefined) {
  if (!list) {
    return [];
  }
  return list.flat().filter(Boolean) as HandleNode[];
}

export interface WorkflowNodeData {
  config?: {
    refList?: InputRefItem[];
    invalidList?: InputInvalidItem[];
    contextList?: InputContextItem[];
    value?: Record<string, any>;
  };
  style?: Record<string, any>;
  handle?: {
    output: HandleNode[][];
  };
  minSize?: {
    height: number;
    width: number;
  };
  transform?: {
    resizable?: boolean;
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

/** 解析后runner使用 */
export interface ParsedNode {
  id: string;
  parentId?: string;
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
