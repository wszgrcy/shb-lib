import {
  computed,
  inject,
  RootStaticInjectOptions,
  signal,
} from 'static-injector';

import { omitBy } from 'es-toolkit';
import { bufferWhen, debounceTime, filter, Subject } from 'rxjs';
import { path } from '@cyia/vfs2';
import { HistoryItem } from './type/history';
import { OpenAIConfigToken } from './token';
import * as fs from 'fs';
import { parse, stringify } from 'yaml';
import { ChatMessageListOutputType } from './message.define';
import dayjs from 'dayjs';
import { isEmptyInput } from '@cyia/util';

export class ChatHistoryService {
  #update$ = signal(0);
  /** 外部监听更新用 */
  update$$ = computed(() => this.#update$());
  #logMap = new Map<string, Subject<HistoryItem>>();
  #config = inject(OpenAIConfigToken);
  #dir() {
    return this.#config().history.dir;
  }
  #createNewListen(fileName: string) {
    const filePath = path.join(this.#dir(), `${fileName}.yml`);
    const instance = new Subject<HistoryItem>();
    instance
      .pipe(
        bufferWhen(() => instance.pipe(debounceTime(2_000))),
        filter((list) => !!list.length),
      )
      .subscribe(async (inputList) => {
        if (!fs.existsSync(this.#dir())) {
          await fs.promises.mkdir(this.#dir(), { recursive: true });
        }
        try {
          let list: HistoryItem[] = [];
          if (await fs.existsSync(filePath)) {
            const content = await fs.promises.readFile(filePath, {
              encoding: 'utf-8',
            });
            list = parse(content);
          } else {
            list = [];
          }
          list.unshift(...inputList.reverse());
          await fs.promises.writeFile(filePath, stringify(list));
          this.#update$.update((a) => a + 1);
        } catch (error) {
          this.#config().captureException(error);
        }
      });
    this.#logMap.set(fileName, instance);

    return instance;
  }
  save(messages: ChatMessageListOutputType, options: any, config: any) {
    if (!this.#config().history.enable) {
      return;
    }
    try {
      const fileName = dayjs().format('YYYY-MM-DD');
      const message$ =
        this.#logMap.get(fileName) ?? this.#createNewListen(fileName);
      const item = {
        date: dayjs().valueOf(),
        messages,
        options: omitBy(options, isEmptyInput),
        config,
      };
      message$.next(item);
    } catch (error) {
      try {
        this.#config().captureException(error);
      } catch (error) {}
    }
  }
}
