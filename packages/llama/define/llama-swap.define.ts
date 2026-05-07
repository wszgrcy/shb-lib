import * as v from 'valibot';
export const LlamaSwapDefine = v.object({
  healthCheckTimeout: v.optional(v.number(), 120),
  logLevel: v.optional(v.picklist(['debug', 'info', 'warn', 'error'])),
  startPort: v.optional(v.number()),
  groups: v.optional(
    v.record(
      v.string(),
      v.object({
        swap: v.pipe(
          v.optional(v.boolean()),
          v.description(
            `- true : 仅允许一个模型同时运行\n- false : 所有模型均可同时运行，无需切换`,
          ),
        ),
        exclusive: v.pipe(
          v.optional(v.boolean()),
          v.description(
            `- true：当此组运行模型时，会导致所有其他组卸载其模型\n- false：不会影响其他组`,
          ),
        ),
        members: v.array(v.string()),
        persistent: v.optional(v.boolean()),
      }),
    ),
  ),
});
