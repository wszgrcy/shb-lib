import { SpeedControlType } from '@shenghuabi/crunker';
export type AudioOptions = {
  startInterval?: number;
  endInterval?: number;
  speedControl?: SpeedControlType;
};
export interface FileConfigType {
  referenceMap?: Record<string, string>;
  generateOptions?: any;
  audioOptions?: AudioOptions;
}
