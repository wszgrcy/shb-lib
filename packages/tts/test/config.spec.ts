import { createRootInjector, signal } from 'static-injector';
import { expect } from 'chai';
import * as v from 'valibot';
import { ConfigManagerService } from '../config-manager/manager.service';
import fs from 'fs';
import {
  PythonAddonConfigToken,
  PythonAddonDefine,
  PythonAddonOptions,
} from '../type';
import { path } from '@cyia/vfs2';
describe('manager', () => {
  const config: PythonAddonOptions = v.parse(PythonAddonDefine, {
    dir: path.join(process.cwd(), '.test-dir'),
  });
  const providers = [
    ConfigManagerService,
    { provide: PythonAddonConfigToken, useValue: signal(config) },
  ];
  beforeEach(async () => {
    await fs.promises.rm(path.join(config.dir, 'config.yml'), {
      force: true,
      recursive: true,
    });
  });
  it('init', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    const { references } = await service.getConfig();
    expect(references).deep.eq([]);
  });
  it('add/remove default', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    await service.setRef(new Uint8Array());
    let {
      references,
      defaultLanguagePlayerReference: defaultLanguagePlayerReference,
    } = await service.getConfig();

    expect(references.length).eq(1);
    expect(references[0].player).eq('default');
    expect(references[0].state).eq('default');
    expect(references[0].language).eq('chinese');
    expect(references[0].filePath).contain(
      path.join('reference', 'default', 'chinese', 'default'),
    );

    expect(defaultLanguagePlayerReference['chinese']).eq('default');
    // remove
    await service.removeRef(references[0].id);

    ({
      references,
      defaultLanguagePlayerReference: defaultLanguagePlayerReference,
    } = await service.getConfig());
    expect(references.length).eq(0);
    expect(Object.keys(defaultLanguagePlayerReference).length).eq(0);
    expect(Object.keys(defaultLanguagePlayerReference).length).eq(0);
  });
  it('add/remove', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's1',
      language: 'l1',
    });
    let {
      references,
      defaultLanguagePlayerReference: defaultLanguagePlayerReference,
    } = await service.getConfig();

    expect(references.length).eq(1);
    expect(references[0].player).eq('n1');
    expect(references[0].state).eq('s1');
    expect(references[0].language).eq('l1');
    expect(references[0].filePath).contain(
      path.join('reference', 'n1', 'l1', 's1'),
    );

    expect(defaultLanguagePlayerReference['l1']).eq('n1');
    // remove
    await service.removeRef(references[0].id);
    let defaultPlayerStateReference;
    ({
      references,
      defaultLanguagePlayerReference: defaultLanguagePlayerReference,
      // eslint-disable-next-line prefer-const
      defaultPlayerStateReference,
    } = await service.getConfig());
    expect(references.length).eq(0);
    expect(Object.keys(defaultLanguagePlayerReference).length).eq(0);
    expect(Object.keys(defaultPlayerStateReference).length).eq(0);
  });
  it('replace', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's1',
      language: 'l1',
    });
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's1',
      language: 'l1',
    });
    let {
      references,
      defaultLanguagePlayerReference: defaultLanguagePlayerReference,
    } = await service.getConfig();

    expect(references.length).eq(1);
    expect(references[0].player).eq('n1');
    expect(references[0].state).eq('s1');
    expect(references[0].language).eq('l1');
    expect(references[0].filePath).contain(
      path.join('reference', 'n1', 'l1', 's1'),
    );

    expect(defaultLanguagePlayerReference['l1']).eq('n1');
    // remove
    await service.removeRef(references[0].id);
    let defaultPlayerStateReference;
    ({
      references,
      defaultLanguagePlayerReference,
      // eslint-disable-next-line prefer-const
      defaultPlayerStateReference,
    } = await service.getConfig());
    expect(references.length).eq(0);
    expect(Object.keys(defaultLanguagePlayerReference).length).eq(0);
    expect(Object.keys(defaultPlayerStateReference).length).eq(0);
  });
  it('add state', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's1',
      language: 'l1',
    });
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's2',
      language: 'l1',
    });
    let {
      references,
      defaultLanguagePlayerReference: defaultLanguagePlayerReference,
    } = await service.getConfig();

    expect(references.length).eq(2);
    expect(references[0].player).eq('n1');
    expect(references[0].state).eq('s1');
    expect(references[0].language).eq('l1');
    expect(references[0].filePath).contain(
      path.join('reference', 'n1', 'l1', 's1'),
    );
    expect(references[1].player).eq('n1');
    expect(references[1].state).eq('s2');
    expect(references[1].language).eq('l1');
    expect(references[1].filePath).contain(
      path.join('reference', 'n1', 'l1', 's2'),
    );

    expect(defaultLanguagePlayerReference['l1']).eq('n1');
    // remove
    await service.removeRef(references[0].id);

    ({
      references,
      defaultLanguagePlayerReference: defaultLanguagePlayerReference,
    } = await service.getConfig());
    expect(references.length).eq(1);
  });
  it('add language', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's1',
      language: 'l1',
    });
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's2',
      language: 'l2',
    });
    let {
      references,
      defaultLanguagePlayerReference: defaultLanguagePlayerReference,
    } = await service.getConfig();

    expect(references.length).eq(2);
    expect(references[0].player).eq('n1');
    expect(references[0].state).eq('s1');
    expect(references[0].language).eq('l1');
    expect(references[0].filePath).contain(
      path.join('reference', 'n1', 'l1', 's1'),
    );
    expect(references[1].player).eq('n1');
    expect(references[1].state).eq('s2');
    expect(references[1].language).eq('l2');
    expect(references[1].filePath).contain(
      path.join('reference', 'n1', 'l2', 's2'),
    );

    expect(defaultLanguagePlayerReference['l1']).eq('n1');
    expect(defaultLanguagePlayerReference['l2']).eq('n1');
    // remove
    await service.removeRef(references[0].id);
    ({
      references,
      defaultLanguagePlayerReference: defaultLanguagePlayerReference,
    } = await service.getConfig());
    expect(references.length).eq(1);
  });

  it('get', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    await service.setRef(new Uint8Array(), {
      player: 'n0',
      state: 's0',
      language: 'l1',
    });
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's1',
      language: 'l1',
    });
    await service.setRef(new Uint8Array(), {
      player: 'n2',
      state: 's2',
      language: 'l1',
    });
    const {
      references,
      defaultLanguagePlayerReference: defaultLanguageActorReference,
    } = await service.getConfig();
    // 精确查找
    let result = await service.get({
      player: 'n1',
      state: 's1',
      language: 'l1',
    });
    expect(result!.filePath).contain(path.join('reference', 'n1', 'l1', 's1'));
    // 取默认状态
    result = await service.get({
      player: 'n2',
      state: 's5',
      language: 'l1',
    });
    expect(result!.filePath).contain(path.join('reference', 'n2', 'l1', 's2'));
    // 默认语言兼容
    result = await service.get({
      player: 'n3',
      state: 's5',
      language: 'l1',
    });
    expect(result!.filePath).contain(path.join('reference', 'n0', 'l1', 's0'));
  });

  it('setDefaultState', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's1',
      language: 'l1',
    });
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's2',
      language: 'l1',
    });
    const {
      references,
      defaultPlayerStateReference: defaultActorStateReference,
    } = await service.getConfig();
    expect(defaultActorStateReference['n1']).eq('s1');
    await service.setRefDefaultPlayerState('n1', 's2');
    expect(defaultActorStateReference['n1']).eq('s2');
  });
  it('setDefaultLA', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's1',
      language: 'l1',
    });
    await service.setRef(new Uint8Array(), {
      player: 'n2',
      state: 's1',
      language: 'l1',
    });
    const {
      references,
      defaultLanguagePlayerReference: defaultLanguageActorReference,
    } = await service.getConfig();
    expect(defaultLanguageActorReference['l1']).eq('n1');
    await service.setRefDefaultLanguage('l1', 'n2');
    expect(defaultLanguageActorReference['l1']).eq('n2');
  });
  it('removeChangeLA', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's1',
      language: 'l1',
    });
    await service.setRef(new Uint8Array(), {
      player: 'n2',
      state: 's1',
      language: 'l1',
    });
    const {
      references,
      defaultLanguagePlayerReference: defaultLanguageActorReference,
    } = await service.getConfig();
    expect(defaultLanguageActorReference['l1']).eq('n1');
    // await service.setRefDefaultLanguage('l1', 'n2');
    await service.removeRef(references[0].id);
    expect(defaultLanguageActorReference['l1']).eq('n2');
  });
  it('removeChangeAS', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's1',
      language: 'l1',
    });
    await service.setRef(new Uint8Array(), {
      player: 'n1',
      state: 's2',
      language: 'l1',
    });
    const {
      references,
      defaultPlayerStateReference: defaultActorStateReference,
    } = await service.getConfig();
    expect(defaultActorStateReference['n1']).eq('s1');
    // await service.setRefDefaultLanguage('l1', 'n2');
    await service.removeRef(references[0].id);
    expect(defaultActorStateReference['n1']).eq('s2');
  });
  it('别名', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    await service.setRef(new Uint8Array(), {
      player: 'n0',
      state: 's0',
      language: 'l1',
      aliases: ['y1'],
    });

    const {
      references,
      defaultLanguagePlayerReference: defaultLanguageActorReference,
    } = await service.getConfig();
    // 精确查找
    const result = await service.get({
      player: 'y1',
      state: 's1',
      language: 'l1',
    });
  });
  it('情绪预制', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    const data = await service.setIndexTTSRef(
      { player: '1', state: '1' },
      { emo_alpha: 1 },
    );
    const SaveData = {
      id: data.id,
      language: 'chinese',
      player: '1',
      state: '1',
      config: { emo_alpha: 1 },
    };
    expect(data).deep.eq(SaveData);
    let config = await service.getConfig();
    expect(config.indexTTSEmoReferences.length).eq(1);
    const getAct = await service.getIndexTTSRef({
      player: '1',
      state: '1',
      language: 'chinese',
    });

    expect(getAct).deep.eq(SaveData);
    const getData = await service.getIndexTTSRefById(data.id);
    expect(getData).deep.eq(SaveData);
    await service.removeIndexTTSRef(data.id);
    config = await service.getConfig();
    expect(config.indexTTSEmoReferences.length).eq(0);
  });
  it('情绪2', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    const data = await service.setIndexTTSRef(
      { player: '1', state: '1' },
      {
        emo_audio_prompt: { player: '1', state: '1', language: '1' },
        emo_alpha: 1,
      },
    );
    expect(data).deep.eq({
      id: data.id,
      language: 'chinese',
      player: '1',
      state: '1',
      config: {
        emo_audio_prompt: { player: '1', state: '1', language: '1' },
        emo_alpha: 1,
      },
    });
  });
  it('情绪3', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    const data = await service.setIndexTTSRef(
      { player: '1', state: '1' },
      { emo_vector: [0, 0, 0, 0, 0, 0, 0, 0] },
    );
    expect(data).deep.eq({
      id: data.id,
      language: 'chinese',
      player: '1',
      state: '1',
      config: { emo_vector: [0, 0, 0, 0, 0, 0, 0, 0], use_random: false },
    });
  });
  it('情绪4', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    const data = await service.setIndexTTSRef(
      { player: '1', state: '1' },
      { emo_text: 'text' },
    );
    expect(data).deep.eq({
      id: data.id,
      language: 'chinese',
      player: '1',
      state: '1',
      config: { emo_text: 'text', use_random: false, use_emo_text: true },
    });
  });
  it('情绪别名', async () => {
    const injector = createRootInjector({
      providers: providers,
    });

    const service = injector.get(ConfigManagerService);
    const data = await service.setIndexTTSRef(
      { player: '1', state: '1', aliases: ['二级'] },
      { emo_alpha: 1 },
    );

    const config = await service.getConfig();
    expect(config.indexTTSEmoReferences[0].aliases).deep.eq(['二级']);
  });
});
