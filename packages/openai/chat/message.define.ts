import * as v from 'valibot';
export const ChatCompletionContentPartStr = v.object({
  text: v.string(),
  type: v.optional(v.literal('text'), 'text'),
});
export type ChatCompletionContentPartStrType = v.InferOutput<
  typeof ChatCompletionContentPartStr
>;

export const ChatCompletionContentPartImage = v.object({
  image_url: v.object({
    url: v.string(),
    detail: v.optional(v.picklist(['auto', 'low', 'high'])),
  }),
  type: v.optional(v.literal('image_url'), 'image_url'),
});
export type ChatCompletionContentPartImageType = v.InferOutput<
  typeof ChatCompletionContentPartImage
>;
export const ChatCompletionContentPart = v.array(
  v.union([ChatCompletionContentPartStr, ChatCompletionContentPartImage]),
);
export const SystemChatCompletionContent = v.array(
  ChatCompletionContentPartStr,
);
export const UserChatCompletionContent = ChatCompletionContentPart;
export type UserChatCompletionContentType = v.InferOutput<
  typeof UserChatCompletionContent
>;
export const AssistantChatCompletionContent = v.array(
  ChatCompletionContentPartStr,
);
export const SystemChatMessage = v.object({
  role: v.optional(v.literal('system'), 'system'),
  content: SystemChatCompletionContent,
});
export type SystemChatMessageType = v.InferOutput<typeof SystemChatMessage>;
export const UserChatMessage = v.object({
  role: v.optional(v.literal('user'), 'user'),
  content: UserChatCompletionContent,
});
export type UserChatMessageType = v.InferOutput<typeof UserChatMessage>;

export const AssistantChatMessage = v.object({
  role: v.optional(v.literal('assistant'), 'assistant'),
  content: AssistantChatCompletionContent,
  thinkContent: v.optional(v.string()),
});

export type AssistantChatMessageType = v.InferOutput<
  typeof AssistantChatMessage
>;

export const ChatMessageItemDefine = v.union([
  SystemChatMessage,
  UserChatMessage,
  AssistantChatMessage,
]);
export type ChatMessageItemType = v.InferOutput<typeof ChatMessageItemDefine>;
export const ChatMessageListDefine = v.array(ChatMessageItemDefine);

export type ChatMessageListOutputType = v.InferOutput<
  typeof ChatMessageListDefine
>;
export type ChatMessageListInputType = v.InferOutput<
  typeof ChatMessageListDefine
>;
