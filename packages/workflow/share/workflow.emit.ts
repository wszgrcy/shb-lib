import { Observer } from './type';
import { createLLMData, WorkflowStreamData } from './type2';

export class WorkflowEmitter {
  #ob?: Observer<WorkflowStreamData, any>;
  setObserver(ob: Observer<any, any>) {
    this.#ob = ob;
  }
  getObserver() {
    return this.#ob;
  }

  createLLMData = createLLMData;
  send(data: WorkflowStreamData) {
    if (this.#ob) {
      this.#ob.next(data);
    }
  }
}
