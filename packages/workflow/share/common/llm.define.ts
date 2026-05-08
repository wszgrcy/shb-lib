import {
  asVirtualGroup,
  actions,
  setComponent,
} from '@piying/view-angular-core';
import { condition } from '@piying/valibot-visit';
import * as v from 'valibot';
import { asColumn } from '../util/layout';
export function llmModelConfig(item?: { label: string }) {
  return v.pipe(
    v.intersect([
      v.pipe(
        v.intersect([
          v.pipe(
            v.object({
              name: v.pipe(
                v.optional(v.string()),
                v.title('预定义模型配置'),
                setComponent('select'),
                actions.inputs.patchAsync({
                  options: (field) => field.context!.getModelList(),
                }),
              ),
              model: v.pipe(v.optional(v.string()), v.title('模型')),
              // todo 配置变化configuration层被去掉.这里应该更详细支持更多参数

              baseURL: v.pipe(v.optional(v.string()), v.title('地址')),
            }),
            asColumn(),
          ),
        ]),
        v.title(item?.label ?? '对话模型'),
        condition({
          environments: ['display', 'config'],
          actions: [asVirtualGroup()],
        }),
      ),
    ]),
    condition({
      environments: ['display', 'config'],
      actions: [asVirtualGroup()],
    }),
    setComponent('accordion'),
  );
}

export type ModelInputConfig = v.InferOutput<ReturnType<typeof llmModelConfig>>;
