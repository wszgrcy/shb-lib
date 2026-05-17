import { inject } from 'static-injector';

import { parse } from 'yaml';

import { ChatMessageListOutputType } from '@shenghuabi/openai';

import { uniqBy } from 'es-toolkit';

import { CHAT_NODE_DEFINE, ResponseType } from '../chat.node.define';
import { createAssistantMessage } from '@shenghuabi/openai';

import { LogService } from '@cyia/external-call';
import { NodeRunnerBase } from '../../../../runner/runner-item';
import { TemplateFormatService } from '../../../../template-format.service';
import { AbortSignalToken, ChatServiceToken } from '../../../../token';
import { createLLMData } from '../../../../share/type2';
import {
  DEFAULT_CHAT_SCHEMA_KEY,
  RUNNER_ORIGIN_OUTPUT_KEY,
} from '../../../../share/common/const';
import { jsonParse, yamlParse, markdownParse, isChatSchema } from '@cyia/util';

export class LlmRunner extends NodeRunnerBase {
  #format = inject(TemplateFormatService);
  #chatService = inject(ChatServiceToken);
  #abort = inject(AbortSignalToken);
  #channel = inject(LogService).getToken('chat');

  override async run() {
    const { metadataList, obj } = await this.getInputChat();
    const inputJsonSchema = this.inputParams.get(DEFAULT_CHAT_SCHEMA_KEY);
    const nodeResult = this.getParsedNode(CHAT_NODE_DEFINE);
    const config = nodeResult;

    const examples = config.examples;
    const list = nodeResult.value;
    const historyList = list.map((item) => {
      const content = this.#format.interpolate(
        item.content
          .map((item) => (item.type === 'text' ? item.text : ''))
          .join('\n'),
        obj,
      );
      return {
        role: item.role,
        content: [
          { type: 'text', text: content },
          ...item.content
            .filter((item) => item.type === 'image_url')
            .flatMap((item) => {
              if (item.type === 'image_url') {
                return obj[item.image_url.url].map((item: any) => ({
                  type: 'image_url',
                  image_url: { url: item.data },
                }));
              }
              return item;
            }),
        ],
      };
    }) as ChatMessageListOutputType;
    const schema = isChatSchema(inputJsonSchema?.value);
    if (inputJsonSchema?.value && !schema) {
      throw new Error(
        `JsonSchema传入格式异常,需要: {name:string,schema:object},传入: ${JSON.stringify(inputJsonSchema.value)}`,
      );
    } else if (schema) {
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
    const llm = await this.#chatService.chat(this.mergeChatModel(config.llm));

    // doc 用于调试
    // console.log(historyList);
    // 调用位置
    const result = await llm.stream(
      {
        messages: historyList,
        response_format:
          config.responseFormat === 'json_schema'
            ? { type: 'json_schema', json_schema: inputJsonSchema?.value }
            : config.responseFormat === 'json_object'
              ? { type: 'json_object' }
              : undefined,
      },
      { signal: this.#abort },
    );

    const streamData = createLLMData({
      node: this.node,
      value: '',
      extra: {
        references: uniqBy(
          metadataList,
          (item) => item.type + item.description + item.tooltip || '',
        ),
        historyList: [],
        delta: '',
        content: '',
      },
    });
    const endRef = this.#chatService.getMetadataEndRef(
      streamData.extra!.references,
    );
    for await (const item of result) {
      const value = endRef ? item.content + endRef : item.content;
      streamData.value = value;
      streamData.extra = { ...streamData.extra, ...item, content: value };

      this.emitter.send(streamData);
    }
    const resultContent = streamData.value;
    streamData.extra.delta = '';
    historyList.push(createAssistantMessage(resultContent));
    streamData.extra.historyList = historyList;
    this.emitter.send(streamData);
    return async (outputName: string) => {
      if (outputName === RUNNER_ORIGIN_OUTPUT_KEY) {
        return {
          value: streamData.value,
          dataId: streamData.dataId,
          extra: streamData.extra,
        };
      }
      let value: any;
      switch (config.parseBy) {
        case 'markdown':
          value = markdownParse(resultContent);
          break;
        case 'json':
          value = jsonParse(resultContent);
          break;
        case 'yaml':
          value = yamlParse(resultContent);
          break;
        default:
          value = resultContent;
          break;
      }
      if (typeof value === 'undefined') {
        throw new Error(`解析${config.parseBy}失败`);
      }
      return { value, dataId: streamData.dataId, extra: streamData.extra };
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
