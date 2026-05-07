import {
  GITHUB_URL_TOKEN,
  HUGGINGFACE_URL_TOKEN,
  DownloadConfigToken,
} from '@cyia/external-call';
import { computed, signal } from 'static-injector';
import { LLamaConfigToken, OLLAMA_MODEL_URL_TOKEN } from '../../token';
import { path } from '@cyia/vfs2';

export function getCommonProvider() {
  const dir = path.join(process.cwd(), '.tmp', 'llama');

  return [
    {
      provide: GITHUB_URL_TOKEN,
      useValue: computed(() =>
        false ? 'github.com' : 'github-release.tbontop.top',
      ),
    },
    {
      provide: LLamaConfigToken,
      useValue: signal({ dir: dir, listen: '127.0.0.1:12345' }),
    },
    {
      provide: OLLAMA_MODEL_URL_TOKEN,
      useValue: computed(() => 'ollama-model.tbontop.top'),
    },
    {
      provide: HUGGINGFACE_URL_TOKEN,
      useValue: computed(() => 'hg-model.tbontop.top'),
    },
    {
      provide: DownloadConfigToken,
      useValue: computed(() => {}),
    },
    // {
    //   provide: HUGGINGFACE_TOKEN_TOKEN,
    //   useValue: computed(() => 'xxxx'),
    // },
  ];
}
