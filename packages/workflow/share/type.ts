import type { Node } from '@xyflow/react';
import type {
  WorkflowNodeData,
} from './handle-node';
import type { Injector } from 'static-injector';
import type * as v from 'valibot';
import { WorkflowNodeConfigOutputType } from './common/define';
export type ChatMetadataReference =
  | {
      type: 'knowledge';
      knowledgeName: string;
      fileName: string;
      loc?: {
        lines: {
          from: number;
          to: number;
        };
      };
    }
  | {
      type: 'dict';
      word: string;
      content: string;
    }
  | {
      type: 'card';
      fileName: string;
    }
  | {
      type: 'url';
      title: string;
      url: string;
    };

export interface ChatMetadata {
  type: string;
  description: string;
  tooltip?: string;
  reference?: ChatMetadataReference;
}
export type ChatDataRef = {
  toString(): string;
  ref: ChatMetadata | ChatMetadata[];
};
/** 对话插入数据 */
export type ChatInsertData = string | ChatDataRef;
export type ChatInputType = 'object' | 'string' | 'image' | 'schema';
/** 准备 context/workflow 通用 */
export type ChatInput2 = {
  inputType: ChatInputType;
  /** 实际存值 */
  value: string;
  /** 用于显示 */
  label: string;
  optional?: boolean;
};
export type CommonChatInput = ChatInput2;

export interface Observer<TValue, TError> {
  next: (value: TValue) => void;
  error: (err: TError) => void;
  complete: () => void;
}

export type CustomNode<T extends Record<string, any> = Record<string, any>> =
  Node<WorkflowNodeData & T>;

export type InitDataFunction = () => Partial<CustomNode>;
export type NodeComponentType = {
  afterAdd?: (node: CustomNode, injector: Injector) => any;
  priority?: number;
  configDefine?: v.BaseSchema<any, any, any>;
} & WorkflowNodeConfigOutputType;

// 单列?
export type WebviewNodeConfig = NodeComponentType & {
  configDefine?: v.BaseSchema<any, any, any>;
  initData?: InitDataFunction;
  component?: any;
};
