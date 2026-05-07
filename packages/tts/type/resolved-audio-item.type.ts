import { AudioItemType } from './audio-item.define';
export type ResolvedGenerateOptions = Omit<
  AudioItemType['generateOptions'],
  'reference' | 'emo'
> & {
  reference: string;
  emo:
    | {
        emo_alpha: 1;
      }
    | {
        emo_audio_prompt: string;
        emo_alpha: number;
      }
    | {
        use_random: boolean;
        emo_vector: [
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
        ];
      }
    | {
        use_random: boolean;
        emo_text: string;
        use_emo_text: true;
      };
};
export type ResolvedAudioItemType = Omit<AudioItemType, 'generateOptions'> & {
  generateOptions: ResolvedGenerateOptions;
};
