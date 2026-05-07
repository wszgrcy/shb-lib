import { createInjector, inject, Injector } from 'static-injector';

import {
  AbortSignalToken,
  CurrentCallNodeToken,
  CurrentContextToken,
  CurrentNodeToken,
  CurrentWorkflowToken,
  InputParamsToken,
  ModelOptionsToken,
  ParentContextToken,
  EnviromentParametersToken,
  UseInputToken,
  InputsToken,
} from '../token';
import { ItemRunnerObject } from './define';
import {
  createResultData,
  WorkflowRunnerInputs,
  WorkflowRunnerInputsWithContext,
} from '../share/type2';
import { WorkflowEmitter } from '../share/workflow.emit';
import { NodeRunnerBase, OutputResult, RunnerResult } from './runner-item';
import { AbortSignalError, RunnerError } from './runner-error';

// 内联

import {
  ParsedNode,
  ResolvedInputNode,
  ResolvedWorkflow,
} from '../share/handle-node';
import { LogService, LogType } from '@cyia/external-call';
import { Observer } from '../share';
import { WorkflowPluginService } from '../plugin/plugin.service';
import { InlineNodeService } from '../inline/inline.service';
/** 用于上下文start */
export const ITERATION_ITEM_SYMBOL = Symbol('ITERATION_ITEM');
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
    inputParams: WorkflowRunnerInputs,
    callNode?: ParsedNode,
    input?: ResolvedInputNode,
  ) {
    const define = await this.#getNodeRunner(item.type);
    return createInjector({
      providers: [
        define,
        { provide: CurrentNodeToken, useValue: item },
        { provide: CurrentCallNodeToken, useValue: callNode },
        { provide: CurrentContextToken, useValue: this },
        { provide: UseInputToken, useValue: input },
        { provide: InputParamsToken, useValue: inputParams },
      ],
      parent: this.#injector,
    }).get(define as any as typeof NodeRunnerBase);
  }
  #abort = inject(AbortSignalToken);
  async #runItem(
    node: ParsedNode,
    callNode?: ParsedNode,
    input?: ResolvedInputNode,
  ): OutputResult {
    try {
      if (this.#abort?.aborted) {
        throw new AbortSignalError();
      }
      /** 融合了全局输入和上下文传递
       * 手动输入的一般都是对话传递，使用label
       * 非手动的一般都是基于节点传递
       */
      const inputParams: WorkflowRunnerInputs = new Map<any, any>(this.inputs);
      for (const input of node.inputs) {
        if (input.nodeId) {
          const inputNode = this.getNodeById(input.nodeId!);
          // 如果是分类器的起点那么跳过，因为是分类器调用的
          if (
            inputNode.subFlowList?.some(
              (subItem) => subItem.startId === node.id,
            )
          ) {
            // 如果未来要使用,那么就在上下文中加一个symbol,提前传入,在这里get
            continue;
          }
          const result = await this.#runItem(inputNode, node, input);

          inputParams.set(input.value, result);
        }
      }
      const nodeRunner = await this.#createNodeRunner(
        node,
        inputParams,
        callNode,
        input,
      );
      const outputList = node.outputs;
      const outputName =
        input?.outputName ?? node.data.outputName ?? outputList[0].value;
      let dataResult = this.#getCallCache(node.id);
      if (dataResult === undefined) {
        {
          const res = await nodeRunner.run();
          dataResult = { result: res };
          this.#callCache.set(node.id, res);
        }
      }
      const outputKey = `${node.id}|${outputName}`;
      const outputResult = this.#getOuputCache(outputKey);
      let returnData;
      if (outputResult === undefined) {
        const res = await dataResult.result(outputName);
        this.#outputCache.set(outputKey, res);
        returnData = res;
      } else {
        returnData = outputResult.result;
      }
      // todo 发射
      this.#emitter.send(
        createResultData({
          ...returnData,
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
    inputs: WorkflowRunnerInputs,
    parent?: WorkflowRunnerContext,
    parentInjector?: Injector,
  ) {
    return createInjector({
      providers: [
        WorkflowRunnerContext,
        { provide: CurrentWorkflowToken, useValue: data },
        { provide: InputsToken, useValue: inputs },
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
    data: ResolvedWorkflow,
    input: WorkflowRunnerInputsWithContext,
    ob?: Observer<any, any>,
    signal?: AbortSignal,
  ) {
    this.log?.info('工作流默认对话配置', input.modelOptions);
    const injector = createInjector({
      providers: [
        WorkflowEmitter,
        { provide: AbortSignalToken, useValue: signal },
        {
          provide: EnviromentParametersToken,
          useValue: input.environmentParameters,
        },
        { provide: ModelOptionsToken, useValue: input.modelOptions },
      ],
      parent: this.#injector,
    });

    const runner = this.createContext(data, input.input, undefined, injector);
    if (ob) {
      injector.get(WorkflowEmitter).setObserver(ob);
    }
    return runner.startRun();
  }
}
