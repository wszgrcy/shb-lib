import { inject } from 'static-injector';
import { EnviromentParametersToken, NodeContextToken } from '../../../../token';
import type {
  ChatMessageListInputType,
  ChatMessageListOutputType,
} from '@shenghuabi/openai';
import { ChatMetadata } from '../../../../share/type';
// todo 开发中
import { serializeTemplate } from '@shenghuabi/lexical-textarea/variable-serialization';
import { get } from 'es-toolkit/compat';
export function useChat() {
  const context = inject(NodeContextToken);
  const environmentInjector = inject(EnviromentParametersToken);
  return (list: ChatMessageListInputType) => {
    const metadataList: ChatMetadata[] = [];
    const list2 = list.map((item) => {
      // ChatData 类型,分为字符串和带引用的
      const contentList = item.content.map((contentChild) => {
        if (contentChild.type === 'text') {
          const text = serializeTemplate(contentChild.text as any, (item) => {
            if (item.type === 'custom') {
              return get(environmentInjector, item.value);
            }
            const result = get(context, item.value);
            if (typeof result === 'string') {
              return result;
            }
            if ('ref' in result) {
              if (Array.isArray(result.ref)) {
                metadataList.push(...result.ref);
              } else {
                metadataList.push(result.ref);
              }
            }
            return `${result}`;
          });
          return { type: contentChild.type, text: text.trim() };
        } else if (contentChild.type === 'image_url') {
          const url = serializeTemplate(
            contentChild.image_url.url as any,
            (item) => {
              const result = get(context, item.value);
              if (item.type === 'custom') {
                return get(environmentInjector, item.value);
              }
              if (typeof result === 'string') {
                return result;
              }
              if ('ref' in result) {
                if (Array.isArray(result.ref)) {
                  metadataList.push(...result.ref);
                } else {
                  metadataList.push(result.ref);
                }
              }
              return `${result}`;
            },
          );
          return {
            type: contentChild.type,
            text: { image_url: { url: url.trim() } },
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
