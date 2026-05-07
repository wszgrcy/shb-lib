import { InjectionToken, Signal } from 'static-injector';
import * as v from 'valibot';
export const PythonAddonDefine = v.object({
  port: v.pipe(v.optional(v.number(), 9900), v.minValue(1), v.maxValue(65535)),
  host: v.pipe(v.optional(v.string(), '127.0.0.1')),
  dir: v.pipe(v.string()),
  idleTime: v.pipe(v.optional(v.number(), 300_000)),
  device: v.pipe(v.optional(v.string(), 'cpu')),
  //   modelDir: v.pipe(v.string()),
  env: v.pipe(
    v.optional(v.record(v.string(), v.string())),
    v.title('附加在python进程中的额外环境变量'),
  ),
});
export type PythonAddonOptions = v.InferOutput<typeof PythonAddonDefine>;
// export interface IndexTTSOptions {
//   port: number;
//   host: string;
//   dir: string;
//   modelDir: string;
// }
export const PythonAddonConfigToken = new InjectionToken<
  Signal<PythonAddonOptions>
>('PythonAddonConfig');

export const LanguageMap = {
  chinese: '汉语',
  english: '英语',
};
