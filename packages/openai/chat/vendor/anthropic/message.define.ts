import { isTruthy } from '@cyia/util';
import {
  SystemChatCompletionContent,
  UserChatMessage,
  AssistantChatMessage,
  ChatCompletionContentPartStrType,
  ChatCompletionContentPartImageType,
} from '../../message.define';
import * as v from 'valibot';
// data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAR
function baseImageSplit(str: string) {
  const mimeTypeIndex = str.indexOf(';');
  const dataStartIndex = str.indexOf(',', mimeTypeIndex);
  return {
    mimeType: str.slice(5, mimeTypeIndex) as
      | 'image/jpeg'
      | 'image/png'
      | 'image/gif'
      | 'image/webp',
    data: str.slice(dataStartIndex + 1),
  };
}

export const AnthropicSystemMessageDefine = v.pipe(
  SystemChatCompletionContent,
  v.transform((list) =>
    list
      .map((item) => (item.type === 'text' ? item : undefined))
      .filter(isTruthy),
  ),
);
function contentConvert(
  part: ChatCompletionContentPartStrType | ChatCompletionContentPartImageType,
) {
  if (part.type === 'text') {
    return part;
  }
  const result = baseImageSplit(part.image_url.url);
  return {
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: result.mimeType,
      data: result.data,
    },
  };
}
const UserMessageDefine = v.pipe(
  UserChatMessage,
  v.transform((item) => ({
    ...item,
    content: item.content.map(contentConvert),
  })),
);
const AssistantMessageDefine = v.pipe(
  AssistantChatMessage,
  v.transform((item) => ({
    ...item,
    content: item.content.map(contentConvert),
  })),
);
export const AnthropicChatMessageListDefine = v.array(
  v.union([UserMessageDefine, AssistantMessageDefine]),
);
