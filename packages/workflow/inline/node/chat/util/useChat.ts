import { inject } from 'static-injector';
import { NodeContextToken } from '../../../../token';
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

  return (list: ChatMessageListInputType) => {
    const metadataList: ChatMetadata[] = [];
    const list2 = list.map((item) => {
      // ChatData 类型,分为字符串和带引用的
      const contentList = item.content.map((contentChild) => {
        const itemList = [];
        if (contentChild.type === 'text') {
          const text = serializeTemplate(contentChild.text as any, (item) => {
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
          itemList.push({ type: contentChild.type, text: text });
        } else if (contentChild.type === 'image_url') {
          const url = serializeTemplate(
            contentChild.image_url.url as any,
            (item) => {
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
            },
          );
          itemList.push({
            type: contentChild.type,
            text: { image_url: { url: url } },
          });
        }
        return itemList;
      });
      return {
        role: item.role,
        content: contentList,
      };
    }) as any as ChatMessageListOutputType;

    return { metadataList, list: list2 };
  };
}
