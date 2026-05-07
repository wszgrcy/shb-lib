import { ChatMessageListOutputType } from './message.define';

export interface ResolvedChatOptions {
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  baseURL: string;
  verbose: boolean;
  apiKey: string;
  vendor: string;
}
interface ResponseFormatText {
  type: 'text';
}

interface JSONSchema {
  name: string;

  description?: string;

  schema?: Record<string, unknown>;

  strict?: boolean | null;
}

interface ResponseFormatJSONSchema {
  json_schema: JSONSchema;

  type: 'json_schema';
}
interface ResponseFormatJSONObject {
  type: 'json_object';
}
export interface ChatBodyInput {
  response_format?:
    | ResponseFormatText
    | ResponseFormatJSONSchema
    | ResponseFormatJSONObject;
  messages: ChatMessageListOutputType;
}
export type FunctionDefinition = {
  name: string;

  description?: string;

  parameters?: Record<string, unknown>;

  strict?: boolean | null;
};
export type RunnableToolFunctionWithParse = {
  type: 'function';
  function: FunctionDefinition;
};

export type ChatToolBodyInput = ChatBodyInput & {
  tools: RunnableToolFunctionWithParse[];
};
export interface ChatRequestOptions {
  headers?: Record<string, string | null | undefined>;
  signal?: AbortSignal | undefined;
  tryPull?: (error: any) => boolean;
  pullModel?: (name: string) => Promise<any>;
}

export interface OpenAIConfig {
  tryPull?: () => boolean;
  pullModel?: (name: string) => Promise<any>;
  captureException: (error: any) => any;
  history: {
    dir: string;
    enable: boolean;
  };
}
