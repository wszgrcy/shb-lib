import {
  registerFauxProvider,
  fauxAssistantMessage,
  fauxText,
  Context,
  StreamOptions,
  FauxResponseStep,
} from '@earendil-works/pi-ai';

/**
 * 创建一个基于用户输入动态返回响应的方法。
 * @param responseFactory - 根据上下文动态生成响应的工厂函数，接收历史消息和调用序号，返回文本或文本数组
 */
export function createDynamicResponse(
  responseFactory: (context: Context, callCount: number) => string | string[],
) {
  return async (
    context: Context,
    _options: StreamOptions | undefined,
    state: { callCount: number },
  ) => {
    const responses = responseFactory(context, state.callCount);
    const content = Array.isArray(responses)
      ? responses.map((r) => fauxText(r))
      : fauxText(responses);
    return fauxAssistantMessage(content);
  };
}

/** Options for registerFauxProvider. */
export interface MockProviderOptions {
  api?: string;
  provider?: string;
  tokensPerSecond?: number;
}



/**
 * Register a faux mock provider and return a ready-to-use model with cleanup.
 * 
 * @example
 * ```ts
 * const { model, setResponses, unregister } = registerMockProvider();
 * setResponses([fauxAssistantMessage('hello')]);
 * const response = await complete(model, { messages: [{ role: 'user', content: 'hi', timestamp: Date.now() }] });
 * unregister(); // clean up when done
 * ```
 */
export function registerMockProvider(
  options?: MockProviderOptions,
) {
  const registration = registerFauxProvider(options);

  return {
    model: registration.getModel(),
    setResponses: (responses: FauxResponseStep[]) => registration.setResponses(responses),
    unregister: () => registration.unregister(),
  };
}
