import {
  HUGGINGFACE_URL_TOKEN,
  DownloadConfigToken,
  GITHUB_URL_TOKEN,
  HUGGINGFACE_TOKEN_TOKEN,
} from '@cyia/external-call';
import path from 'path';
import { signal } from 'static-injector';
import {
  PythonAddonOptions,
  PythonAddonDefine,
  PythonAddonConfigToken,
} from '../../type';
import * as v from 'valibot';
import { TTSConfigDefine, TTSConfigToken } from '../../type/tts.define';
import { IndexTTSConfigToken, IndexTTSOptionsDefine } from '../../define';
export function getCommonProviders() {
  const config: PythonAddonOptions = v.parse(PythonAddonDefine, {
    dir: path.join(process.cwd(), '.test-dir'),
  });
  return [
    { provide: PythonAddonConfigToken, useValue: signal(config) },
    {
      provide: TTSConfigToken,
      useValue: signal(v.getDefaults(TTSConfigDefine)),
    },
    {
      provide: IndexTTSConfigToken,
      useValue: signal(v.parse(IndexTTSOptionsDefine, {})),
    },
    {
      provide: HUGGINGFACE_URL_TOKEN,
      useValue: signal('hg-model.tbontop.top'),
    },
    {
      provide: GITHUB_URL_TOKEN,
      useValue: signal('github-release.tbontop.top'),
    },
    { provide: DownloadConfigToken, useValue: signal({}) },
    { provide: HUGGINGFACE_TOKEN_TOKEN, useValue: signal(undefined) },
  ];
}
