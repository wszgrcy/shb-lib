import { createInjector, inject, Injector, Provider } from 'static-injector';

import {
  AbortSignalToken,
  CurrentCallNodeToken,
  CurrentContextToken,
  CurrentNodeToken,
  CurrentWorkflowToken,
  ParentContextToken,
  EnviromentParametersToken,
  InputsToken,
  NodeInputsToken,
  NodeContextToken,
  NodeParentMapToken,
} from '../token';
import { ItemRunnerObject } from './define';
import {
  createResultData,
  WorkflowRunnerInputsWithContext,
} from '../share/type2';
import { WorkflowEmitter } from '../share/workflow.emit';
import { NodeRunnerBase, OutputResult, RunnerResult } from './runner-item';
import { AbortSignalError, RunnerError } from './runner-error';

// 内联

import { ParsedNode, ResolvedWorkflow } from '../share/handle-node';
import { LogService, LogType } from '@cyia/external-call';
import { Observer } from '../share';
import { WorkflowPluginService } from '../plugin/plugin.service';
import { InlineNodeService } from '../inline/inline.service';
import { set } from 'es-toolkit/compat';
import * as v from 'valibot';
import { deepClone } from '@cyia/util';
import { deepEqual } from 'fast-equals';
/** 用于上下文start */
export class WorkflowRunnerContext {
  #injector = inject(Injector);
  data = inject(CurrentWorkflowToken);
  parent = inject(ParentContextToken);
  #callCache = new Map<string, Awaited<RunnerResult>>();
  #outputCache = new Map<string, Awaited<OutputResult>>();
  inputs = inject(InputsToken);
  #plugin = inject(WorkflowPluginService);
  #emitter = inject(WorkflowEmitter);
  #inlineNode = inject(InlineNodeService);

  async #getNodeRunner(type: string) {
    return (
      this.#inlineNode.getNodeRunner(type) ??
      (ItemRunnerObject as any)[type] ??
      (await this.#plugin.getNodeRunner(type))
    );
  }
  async #getNodeDefine(type: string) {
    return (
      this.#inlineNode.getNodeDefine(type) ??
      (await this.#plugin.getNodeDefine(type))
    );
  }
  getNodeById(id: string): ParsedNode {
    const result = this.data.nodes[id];
    if (!result) {
      return this.parent?.getNodeById(id)!;
    }
    return result;
  }
  /** 调用缓存，同一个上下文内容不可能变化 */
  #getCallCache(id: string): { result: Awaited<RunnerResult> } | undefined {
    if (this.#callCache.has(id)) {
      return { result: this.#callCache.get(id)! };
    }
    return this.parent ? this.parent.#getCallCache(id) : undefined;
  }
  #getOuputCache(id: string): { result: any } | undefined {
    if (this.#outputCache.has(id)) {
      return { result: this.#outputCache.get(id) };
    }
    return this.parent ? this.parent.#getOuputCache(id) : undefined;
  }
  async startRun() {
    // 从最后一个节点开始,反向查询
    const node = this.getNodeById(this.data.end);
    return this.#runItem(node);
  }
  async run() {
    // 从最后一个节点开始,反向查询
    const node = this.getNodeById(this.data.end);
    return this.#runItem(node);
  }
  // 当前node 调用 node context
  async #createNodeRunner(
    item: ParsedNode,
    inputParams: Record<string, any>,
    contextData?: Record<string, any>,
    callNode?: ParsedNode,
  ) {
    const define = await this.#getNodeRunner(item.type);
    return createInjector({
      providers: [
        define,
        { provide: CurrentNodeToken, useValue: item },
        [
          callNode
            ? { provide: CurrentCallNodeToken, useValue: callNode }
            : undefined,
        ].filter(Boolean),
        { provide: CurrentContextToken, useValue: this },
        { provide: NodeInputsToken, useValue: inputParams },
        { provide: NodeContextToken, useValue: contextData },
      ],
      parent: this.#injector,
    }).get(define as any as typeof NodeRunnerBase);
  }
  #abort = inject(AbortSignalToken);
  async #runItem(
    node: ParsedNode,
    callNode?: ParsedNode,
    input?: { outputName?: string },
  ): OutputResult {
    try {
      if (this.#abort?.aborted) {
        throw new AbortSignalError();
      }
      /** 融合了全局输入和上下文传递
       * 手动输入的一般都是对话传递，使用label
       * 非手动的一般都是基于节点传递
       */
      let inputObjResoved;
      const config = node.data.config;
      const supportList = new Set();
      const config2 = await this.#getNodeDefine(node.type);

      // 配置
      if (config2?.configDefine) {
        const inputObj = deepClone(config?.value ?? {});

        if (config?.refList) {
          for (const input of config.refList) {
            const inputNode = this.getNodeById(input.value);
            // 如果是分类器的起点那么跳过，因为是分类器调用的
            if (
              inputNode.subFlowList?.some(
                (subItem) => subItem.startId === node.id,
              )
            ) {
              // 如果未来要使用,那么就在上下文中加一个symbol,提前传入,在这里get
              continue;
            }
            // todo指定出口
            const result = await this.#runItem(inputNode, node, {
              outputName: input.outlet,
            });
            set(inputObj, input.key, result);
            supportList.add(input.key.join('|'));
          }
        }
        if (config?.invalidList) {
          for (const input of config.invalidList) {
            const keyStr = input.key.join('|');
            if (supportList.has(keyStr)) {
              continue;
            }
            const data = this.inputs[node.id];
            const item = data.find((item) => deepEqual(item.key, input.key))!;
            set(inputObj, input.key, item.value);
            // todo 读取输入
          }
        }
        const result = v.safeParse(config2.configDefine, inputObj);
        if (result.success) {
          inputObjResoved = result.output;
        } else {
          if (typeof PROD_ENV === 'undefined' || !PROD_ENV) {
            console.error(result.issues);
          }
          throw new Error(v.summarize(result.issues));
        }
      }
      let contextData: Record<string, any> = {};
      if (node.context.length) {
        for (const contextItem of node.context) {
          const inputNode = this.getNodeById(contextItem.id);
          const result = await this.#runItem(inputNode, node, {
            outputName: contextItem.output,
          });
          if (contextItem.rest) {
            contextData = { ...contextData, ...result };
          } else {
            contextData[contextItem.output] = result;
          }
        }
      }

      const nodeRunner = await this.#createNodeRunner(
        node,
        inputObjResoved,
        contextData,
        callNode,
      );
      const outputList = node.outputs;
      /** 指定出口/最后一个指定/默认第一个 */
      const outputName =
        input?.outputName ?? node.data.outputName ?? outputList[0]?.name;
      let dataResult = this.#getCallCache(node.id);
      if (dataResult === undefined) {
        const res = await nodeRunner.run();
        dataResult = { result: res };
        this.#callCache.set(node.id, res);
      }
      const outputKey = `${node.id}|${outputName}`;
      const outputResult = this.#getOuputCache(outputKey);
      let returnData;
      if (outputResult === undefined) {
        const outputValue = await dataResult.result(outputName!);
        this.#outputCache.set(outputKey, outputValue);
        returnData = outputValue;
      } else {
        returnData = outputResult.result;
      }
      // todo 发射
      this.#emitter.send(
        createResultData({
          value: returnData,
          node: node,
        }),
      );
      return returnData;
    } catch (error) {
      if (
        (error instanceof Error && error.message === 'Request was aborted.') ||
        error instanceof AbortSignalError
      ) {
        return { value: undefined };
      }
      const item = { title: node.data.title || '' };
      if (error instanceof RunnerError) {
        throw error.create(item);
      } else {
        if (error instanceof Error && error.message === 'Connection error.') {
          const newError = new RunnerError(error.cause, [
            { ...item, message: '接口请求失败' },
          ]);
          delete newError.stack;
          throw newError;
        }
        throw new RunnerError(error, [item]);
      }
    }
  }
}

export class WorkflowRunnerService {
  #injector = inject(Injector);
  /** 自己使用
   * @internal
   */
  createContext(
    data: ResolvedWorkflow,
    parent?: WorkflowRunnerContext,
    parentInjector?: Injector,
  ) {
    return createInjector({
      providers: [
        WorkflowRunnerContext,
        { provide: CurrentWorkflowToken, useValue: data },
        { provide: ParentContextToken, useValue: parent },
      ],
      parent: parentInjector ?? this.#injector,
    }).get(WorkflowRunnerContext);
  }
  #log?: LogType;
  get log() {
    return (
      this.#log ??
      (this.#log = this.#injector
        .get(LogService, undefined, { optional: true })
        ?.getToken('workflow'))
    );
  }

  /** 入口 */
  run(
    wofkflowData: ResolvedWorkflow,
    input: WorkflowRunnerInputsWithContext,
    ob?: Observer<any, any>,
    signal?: AbortSignal,
    providers?: Provider[],
  ) {
    const injector = createInjector({
      providers: [
        WorkflowEmitter,
        { provide: AbortSignalToken, useValue: signal },
        {
          provide: EnviromentParametersToken,
          useValue: input.environmentParameters,
        },
        { provide: InputsToken, useValue: input.inputs },
        { provide: NodeParentMapToken, useValue: new Map() },

        ...(providers ?? []),
      ],
      parent: this.#injector,
    });

    const runner = this.createContext(wofkflowData, undefined, injector);
    if (ob) {
      injector.get(WorkflowEmitter).setObserver(ob);
    }
    return runner.startRun();
  }
}
