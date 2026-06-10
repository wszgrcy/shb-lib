import { inject } from 'static-injector';

import { parse } from 'yaml';

import { ChatMessageListOutputType, createChat } from '@shenghuabi/openai';

import { uniqBy } from 'es-toolkit';

import { CHAT_NODE_DEFINE, ResponseType } from '../node.define';
import { createAssistantMessage } from '@shenghuabi/openai';

import { LogService } from '@cyia/external-call';
import { NodeRunnerBase } from '../../../../runner/runner-item';
import { AbortSignalToken } from '../../../../token';
import { createLLMData } from '../../../../share/type2';
import { jsonParse, yamlParse, markdownParse } from '@cyia/util';
import { useChat } from '../../../../util/useChat';
import { RUNNER_ORIGIN_OUTPUT } from '../../../../share/common/const';

export class LlmRunner extends NodeRunnerBase<typeof CHAT_NODE_DEFINE> {
  #abort = inject(AbortSignalToken);
  #channel = inject(LogService).getToken('chat');
  chatParse = useChat();
  override async run() {
    const nodeResult = this.inputs;
    const config = nodeResult;
    const examples = config.examples;
    const list = nodeResult.value;
    const { list: historyList, metadataList } = await this.chatParse(list);
    const schema = config.jsonSchema;
    if (schema) {
      config.parseBy ??= 'json';
      config.responseFormat ??= 'json_schema';
    }
    if (examples.length) {
      const examplesTemplate: ChatMessageListOutputType = examples
        .filter((item) => item.input.value && item.output.value)
        .flatMap((item) => [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: this.#exampleFormat(item.input, config.parseBy),
              },
            ],
          },
          {
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: this.#exampleFormat(item.output, config.parseBy),
              },
            ],
          },
        ]);
      let index = historyList.findIndex((item) => item.role === 'system');
      index = index === -1 ? 0 : index + 1;
      historyList.splice(index, 0, ...(examplesTemplate as any[]));
    }
    this.#channel?.info('节点对话配置', config.llm);
    const modelConfig = this.mergeChatModel(config.llm);
    const chat2 = createChat(modelConfig);

    const result = chat2(
      { messages: historyList as any },
      {
        signal: this.#abort,
      },
      {
        response_format:
          config.responseFormat === 'json_schema'
            ? { type: 'json_schema', json_schema: config.jsonSchema }
            : config.responseFormat === 'json_object'
              ? { type: 'json_object' }
              : undefined,
      },
    );

    const streamData = createLLMData({
      node: this.node,
      value: '',
      extra: {
        references: uniqBy(
          metadataList,
          (item) => item.type + item.description + item.tooltip || '',
        ),
      },
    });
    let rawContent!: string;
    for await (const item of result) {
      this.emitter.send(streamData);
      switch (item.type) {
        case 'text_delta': {
          if (item.partial.content[0].type === 'text') {
            streamData.value = item.partial.content[0].text;
          }
          break;
        }
        case 'done': {
          rawContent = item.message.content.findLast(
            (item) => item.type === 'text',
          )!.text;
          break;
        }
      }
    }

    historyList.push(createAssistantMessage(rawContent));
    this.emitter.send(streamData);
    return async (id: string) => {
      if (id === undefined || id === RUNNER_ORIGIN_OUTPUT[0].id) {
        return streamData.value;
      } else if (id === 'historyList') {
        return historyList;
      } else if (id === 'format') {
        let value: any;
        switch (config.parseBy) {
          case 'markdown':
            value = markdownParse(rawContent);
            break;
          // todo 格式化内容
          case 'json':
            value = jsonParse(rawContent);
            break;
          case 'yaml':
            value = yamlParse(rawContent);
            break;
          default:
            value = rawContent;
            break;
        }
        if (typeof value === 'undefined') {
          throw new Error(`解析${config.parseBy}失败`);
        }
        return value;
      }
    };
  }
  #exampleFormat(
    data: { format: boolean; value: string },
    format: ResponseType | undefined,
  ) {
    if (data.format) {
      if (format === 'json') {
        return JSON.stringify(parse(data.value));
      }
      return data.value;
    } else {
      return data.value;
    }
  }
}
