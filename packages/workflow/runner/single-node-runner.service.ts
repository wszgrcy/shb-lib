import { createInjector, inject, Injector, Provider } from 'static-injector';
import {
  AbortSignalToken,
  CurrentCallNodeToken,
  CurrentContextToken,
  CurrentNodeToken,
  EnviromentParametersToken,
  NodeContextToken,
  NodeInputsToken,
} from '../token';
import { WorkflowEmitter } from '../share';
import type { NodeComponentType, Observer } from '../share/type';
import type { WorkflowStreamData } from '../share/type2';
import * as v from 'valibot';
import { NodeRunnerBase } from './runner-item';

/** 模拟的节点信息，单节点运行时使用 */
function createMockNode(nodeType: string): any {
  return {
    type: nodeType,
    id: `single-node`,
    data: { config: {}, handle: { output: [] } },
    position: { x: 0, y: 0 },
    context: [],
    outputs: [],
  };
}

/** 单节点运行配置，包含 runner 和 schema 定义 */
export type SingleNodeConfig<
  Schema extends v.BaseSchema<any, any, any> | undefined,
> = NodeComponentType & {
  runner: typeof NodeRunnerBase<Schema>;
  configDefine?: Schema;
};

export class SingleNodeRunnerService {
  #injector = inject(Injector);

  async run<
    TSchema extends v.BaseSchema<any, any, any> | undefined = undefined,
  >(
    nodeConfig: SingleNodeConfig<TSchema>,
    nodeInputs: TSchema extends v.BaseSchema<any, any, any>
      ? v.InferInput<TSchema>
      : any,
    options?: {
      outputId?: string;
      providers?: Provider[];
      observer?: Observer<WorkflowStreamData, any>;
    },
  ): Promise<any> {
    const { runner: RunnerClass, configDefine } = nodeConfig;

    const mockNode = createMockNode(nodeConfig.type);

    let inputData;
    if (configDefine) {
      const result = v.safeParse(configDefine, nodeInputs);
      if (result.success) {
        inputData = result.output;
      } else {
        if (typeof PROD_ENV === 'undefined' || !PROD_ENV) {
          console.error(result.issues);
        }
        throw new Error(v.summarize(result.issues));
      }
    } else {
      inputData = nodeInputs;
    }
    const nodeInjector = createInjector({
      providers: [
        RunnerClass,
        { provide: NodeInputsToken, useValue: inputData },
        { provide: CurrentNodeToken, useValue: mockNode },
        { provide: CurrentCallNodeToken, useValue: undefined },
        { provide: CurrentContextToken, useValue: undefined },
        { provide: EnviromentParametersToken, useValue: undefined },
        {
          provide: NodeContextToken,
          useValue: async () => ({}),
        },
        { provide: AbortSignalToken, useValue: undefined },
        WorkflowEmitter,
        ...(options?.providers ?? []),
      ],
      parent: this.#injector,
    });
    if (options?.observer) {
      nodeInjector.get(WorkflowEmitter).setObserver(options.observer);
    }

    const runnerResult = await nodeInjector.get(RunnerClass).run();

    return await runnerResult(options?.outputId ?? '[default]');
  }
}
