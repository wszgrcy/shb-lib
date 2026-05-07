import { computed, inject, linkedSignal } from 'static-injector';
import { PythonAddonConfigToken } from '../type';
import {
  defineParse,
  getDefaultManagerConfig,
  IndexTTSRefItemSaveDefine,
  ManagerConfigType,
  ReferenceCommonType,
  ReferenceInput,
  ReferenceItem,
  RefFindType,
} from './type';
import fs from 'fs';
import { parse, stringify } from 'yaml';
import { getFileTimestamp } from '@cyia/util';
import { EmoInputType } from '../define';
import { path } from '@cyia/vfs2';
export class ConfigManagerService {
  #paConfig$$ = inject(PythonAddonConfigToken);
  #configPath$$ = computed(() =>
    path.join(this.#paConfig$$().dir, 'config.yml'),
  );
  #configData$$ = linkedSignal(() => {
    const exist = fs.existsSync(this.#configPath$$());
    if (exist) {
      return fs.promises
        .readFile(this.#configPath$$(), { encoding: 'utf-8' })
        .then((data) => parse(data) as ManagerConfigType)
        .then((item) => {
          if ('indexTTSEmoReferences' in item) {
            return item;
          }
          (item as any)['indexTTSEmoReferences'] = [];
          return item;
        });
    } else {
      return Promise.resolve(getDefaultManagerConfig());
    }
  });

  // 默认三个状态,陈述,疑问,
  async setRef(audioU8A: Uint8Array, item: ReferenceInput = {}) {
    const instance = defineParse(ReferenceItem, item);
    const audioDir = path.join('reference', instance.player, instance.language);
    const audioPath = path.join(
      audioDir,
      `${instance.state}-${getFileTimestamp()}.wav`,
    );
    await fs.promises.mkdir(path.join(this.#paConfig$$().dir, audioDir), {
      recursive: true,
    });
    await fs.promises.writeFile(
      path.join(this.#paConfig$$().dir, audioPath),
      audioU8A,
    );
    const data = await this.#configData$$();
    const index = data.references.findIndex((item) => item.id === instance.id);

    if (index === -1) {
      data.references.push({ ...instance, filePath: audioPath });
    } else {
      data.references[index] = { ...instance, filePath: audioPath };
    }
    if (!data.defaultLanguagePlayerReference[instance.language]) {
      data.defaultLanguagePlayerReference[instance.language] = instance.player;
    }
    if (!data.defaultPlayerStateReference[instance.player]) {
      data.defaultPlayerStateReference[instance.player] = instance.state;
    }
    await this.#writeConfig(data);
    return data.references[data.references.length - 1];
  }
  async setRefDefaultLanguage(language: string, player: string) {
    const data = await this.#configData$$();
    data.defaultLanguagePlayerReference![language] = player;
    this.#writeConfig(data);
  }
  async setRefDefaultPlayerState(player: string, state: string) {
    const data = await this.#configData$$();
    data.defaultPlayerStateReference![player] = state;
    this.#writeConfig(data);
  }
  async #writeConfig(data: ManagerConfigType) {
    await fs.promises.writeFile(this.#configPath$$(), stringify(data));
    this.#configData$$.set(Promise.resolve(data));
  }
  async removeRef(id: string) {
    const data = await this.#configData$$();

    const index = data.references.findIndex((item) => item.id === id);
    if (index !== -1) {
      const reference = data.references[index];
      data.references.splice(index, 1);
      const defaultLanguageList = data.defaultLanguagePlayerReference
        ? Object.entries(data.defaultLanguagePlayerReference)
        : [];
      const defaultLanguage = defaultLanguageList.find(
        ([key, value]) => value === reference.player,
      )?.[0];
      if (defaultLanguage) {
        delete data.defaultLanguagePlayerReference[defaultLanguage];
        const newRef = data.references.find(
          (item) => item.language === reference.language,
        );
        if (newRef) {
          data.defaultLanguagePlayerReference[defaultLanguage] =
            newRef?.player!;
        }
      }
      const state = data.defaultPlayerStateReference[reference.player];
      if (state === reference.state) {
        delete data.defaultPlayerStateReference[reference.player];
        const newRef = data.references.find(
          (item) => item.player === reference.player,
        );
        if (newRef) {
          data.defaultPlayerStateReference[reference.player] = newRef.state;
        }
      }
    }
    await this.#writeConfig(data);
  }
  async get(options: RefFindType) {
    // 优先级, 完全相等, 找默认的中文引用,找第一个(如果有)
    // 情感,完全相同, 找默认的情感
    const data = await this.#configData$$();
    const list = data.references.filter(
      (item) =>
        (item.player === options.player ||
          item.aliases?.includes(options.player)) &&
        item.language === options.language,
    );
    if (list.length) {
      const resultItem = list.find((item) => item.state === options.state);
      if (resultItem) {
        // 完全匹配
        return resultItem;
      }
      const defaultState = data.defaultPlayerStateReference[options.player];
      // 匹配默认状态或者第一个
      return list.find((item) => item.state === defaultState) ?? list[0];
    }
    const defaultPlayer = data.defaultLanguagePlayerReference[options.language];
    // 匹配当前语言的默认演员
    if (defaultPlayer) {
      const list = data.references.filter(
        (item) =>
          item.player === defaultPlayer && item.language === options.language,
      );
      if (!list.length) {
        return;
      }
      const exactState = list.find((item) => item.state === options.state);
      if (exactState) {
        // 匹配默认语言的状态
        return exactState;
      }
      // 默认语言默认状态/第一个
      return (
        list.find(
          (item) =>
            item.state === data.defaultPlayerStateReference[defaultPlayer],
        ) ?? list[0]
      );
    }
  }
  async getById(id: string) {
    const data = await this.#configData$$();
    return data.references.find((item) => item.id === id);
  }
  async getDefaultLanguage(language: string) {
    const data = await this.#configData$$();
    const player = data.defaultLanguagePlayerReference[language];
    const state = data.defaultPlayerStateReference[player];
    const result =
      data.references.find(
        (ref) =>
          ref.player === player &&
          ref.state === state &&
          ref.language === language,
      ) || data.references.find((ref) => ref.player === player);
    if (result) {
      return result;
    } else {
      throw new Error(
        `未找到语言[${language}]对应默认的音频引用,请到配音表中进行设置`,
      );
    }
  }
  async getConfig() {
    return await this.#configData$$();
  }
  getAllPlayer$$ = computed(() =>
    this.#configData$$().then(({ references }) => [
      ...new Set(
        references.flatMap((item) => [item.player, ...(item.aliases ?? [])]),
      ),
    ]),
  );
  getAllState$$ = computed(() =>
    this.#configData$$().then(({ references }) => [
      ...new Set(references.map((item) => item.state)),
    ]),
  );
  async setIndexTTSRef(state: ReferenceCommonType, item: EmoInputType) {
    const instance = defineParse(IndexTTSRefItemSaveDefine, {
      ...state,
      config: item,
    });

    const data = await this.#configData$$();
    const list = data.indexTTSEmoReferences;
    const index = list.findIndex((item) => item.id === instance.id);

    if (index === -1) {
      list.push(instance);
    } else {
      list[index] = instance;
    }
    await this.#writeConfig(data);
    return list[list.length - 1];
  }
  async removeIndexTTSRef(id: string) {
    const data = await this.#configData$$();
    const list = data.indexTTSEmoReferences;
    const index = list.findIndex((item) => item.id === id);
    list.splice(index, 1);
    await this.#writeConfig(data);
  }
  async getIndexTTSRef(options: RefFindType) {
    const data = await this.#configData$$();
    const list = data.indexTTSEmoReferences;
    return list.find(
      (item) =>
        (item.player === options.player ||
          item.aliases?.includes(options.player)) &&
        item.language === options.language &&
        item.state === options.state,
    );
  }
  async getIndexTTSRefById(id: string) {
    const data = await this.#configData$$();
    const list = data.indexTTSEmoReferences;
    const index = list.findIndex((item) => item.id === id);
    return index === -1 ? undefined : list[index];
  }
}
