import { inject } from 'static-injector';
import { NodeContextToken } from '../../../../token';
import type {
  ChatMessageListInputType,
  ChatMessageListOutputType,
} from '@shenghuabi/openai';
import { ChatMetadata } from '../../../../share/type';
import { TemplateFormatService } from '../../../../template-format.service';
// todo 开发中
export function useChat() {
  const context = inject(NodeContextToken);
  const format = inject(TemplateFormatService);

  return (list: ChatMessageListInputType) => {
    const metadataList: ChatMetadata[] = [];
    const list2 = list.map((item) => {
      // ChatData 类型,分为字符串和带引用的
      const contentList = item.content.map((contentChild) => {
        const itemList = [];
        if (contentChild.type === 'text') {
          // todo 需要专门的解析,获得contex
          contentChild.text;
          itemList.push({ type: contentChild.type, text: '' });
        } else if (contentChild.type === 'image_url') {
          itemList.push({
            type: contentChild.type,
            text: { image_url: { url: '' } },
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
