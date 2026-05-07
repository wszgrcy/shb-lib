import { getModelManifest } from './get-model-manifest';

export async function autoCheckVendor(
  repo: string,
  options: {
    endpoint: string;
    token?: string;
  },
) {
  try {
    await getModelManifest(repo, options);
    return undefined;
  } catch (error) {}
  return 'ollama' as const;
}
