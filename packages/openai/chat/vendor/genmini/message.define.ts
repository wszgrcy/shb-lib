import * as v from 'valibot';
import {
  AssistantChatMessage,
  ChatCompletionContentPartImageType,
  ChatCompletionContentPartStrType,
  SystemChatMessage,
  UserChatMessage,
} from '../../message.define';
import { isTruthy } from '@cyia/util';

function messageContentTransform(
  list: (
    | ChatCompletionContentPartStrType
    | ChatCompletionContentPartImageType
  )[],
) {
  return list
    .map((item) => (item.type === 'text' ? { text: item.text } : undefined))
    .filter(isTruthy);
}
export const GenminiSystemMessageDefine = v.pipe(
  SystemChatMessage,
  v.transform((item) => ({
    role: 'system',
    parts: messageContentTransform(item.content),
  })),
);

export const GenminiChatMessageListDefine = v.pipe(
  v.array(
    v.union([
      v.pipe(
        UserChatMessage,
        v.transform((item) => ({
          role: 'user' as const,
          parts: messageContentTransform(item.content),
        })),
      ),

      v.pipe(
        AssistantChatMessage,
        v.transform((item) => ({
          role: 'model' as const,
          parts: messageContentTransform(item.content),
        })),
      ),
    ]),
  ),
);
