import type { Node } from '@xyflow/react';
import type { HandleNode } from './handle-node';
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
  Node<
    {
      value?: any;
      style?: Record<string, any>;
      handle?: {
        /** 0 必须是连接点，否则空掉，1必须是value,否则空掉，之后随意 */
        input: HandleNode[][];
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
      config?: Record<string, any>;
      /** 默认输出 */
      outputName?: string;
      /** 在工作流中禁止使用 */
      excludeUsage?: boolean;
      /** 用于前端部分 */
      options?: {
        /** 禁止自动打开配置 */
        disableOpenConfig?: boolean;
      };
    } & T
  >;

export type InitDataFunction = () => Partial<CustomNode>;
export type NodeComponentType = {
  afterAdd?: (node: CustomNode, injector: Injector) => any;
  priority?: number;
} & WorkflowNodeConfigOutputType;

// 单列?
export type WebviewNodeConfig = NodeComponentType & {
  displayConfig?: v.BaseSchema<any, any, any>;
  initData: InitDataFunction;
  //   config: NodeComponentType;

  component?: any;
};
