export class RunnerError extends Error {
  #origin: any;
  #list;
  constructor(origin: any, list: { title: string; message?: string }[]) {
    super(
      `${list
        .map(
          (item) => `[${item.title}]${item.message ? ': ' + item.message : ''}`,
        )
        .join('<-')}`,
      { cause: origin },
    );
    this.#origin = origin;
    this.#list = list;
    delete this.stack;
    this.name = `节点运行异常`;
  }
  create(item: { title: string }) {
    this.#list.push(item);
    return new RunnerError(this.#origin, this.#list);
  }
}
export class AbortSignalError extends Error {}
