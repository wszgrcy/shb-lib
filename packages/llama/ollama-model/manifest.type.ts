export interface MainifestType {
  schemaVersion: number;
  mediaType: string;
  config: MediaConfig;
  layers: MediaConfig[];
}

export interface MediaConfig {
  mediaType: string;
  digest: string;
  size: number;
}
