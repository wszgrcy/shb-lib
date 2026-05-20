import { inject } from 'static-injector';
import { EnviromentParametersToken, NodeContextToken } from '../token';
import type {
  ChatMessageListInputType,
  ChatMessageListOutputType,
} from '@shenghuabi/openai';
import { ChatMetadata } from '../share/type';
import {
  SerializeContextOptions,
  serializeLexicalTextarea,
} from './serialize-text-template';

export function useChat() {
  const contextProvider = inject(NodeContextToken);
  const environmentContext = inject(EnviromentParametersToken)!;
  return async (list: ChatMessageListInputType) => {
    const metadataList: ChatMetadata[] = [];
    const context = await contextProvider();
    const serializeOptions: SerializeContextOptions = {
      context,
      environmentContext,
      onMetadata: (metadata) => {
        metadataList.push(...metadata);
      },
    };
    const list2 = list.map((item) => {
      // ChatData 类型,分为字符串和带引用的
      const contentList = item.content.map((contentChild) => {
        if (contentChild.type === 'text') {
          const text = serializeLexicalTextarea(
            contentChild.text as any,
            serializeOptions,
          );
          return { type: contentChild.type, text };
        } else if (contentChild.type === 'image_url') {
          const url = serializeLexicalTextarea(
            contentChild.image_url.url as any,
            serializeOptions,
          );
          return {
            type: contentChild.type,
            text: { image_url: { url } },
          };
        }
      });
      return {
        role: item.role,
        content: contentList,
      };
    }) as any as ChatMessageListOutputType;

    return { metadataList, list: list2 };
  };
}
