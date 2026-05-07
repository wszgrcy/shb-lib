import { SpeedControlDefine } from '@shenghuabi/crunker/define';
import {
  asVirtualGroup,
  patchWrappers,
  topClass,
} from '@piying/view-angular-core';
import * as v from 'valibot';
import { asColumn, asRow } from '../util/define-helper';
export const isParagraphDefine = v.pipe(
  v.optional(v.boolean(), false),
  topClass('!flex-none'),
  v.title('段落'),
  v.description('该项是否为段落(影响段落间隔)'),
  patchWrappers(['tooltip', 'label']),
);

export const ParagraphIntervalDefine = v.object({
  paragraphInterval: v.pipe(v.optional(v.number()), v.title('段落间隔(秒)')),
});
export const INTERVAL_DEFINE = v.object({
  startInterval: v.pipe(v.optional(v.number()), v.title('起始间隔(秒)')),
  endInterval: v.pipe(v.optional(v.number()), v.title('结尾间隔(秒)')),
});

export const SPEEDCONTROL_DEFINE = v.object({
  speedControl: v.pipe(v.optional(SpeedControlDefine), asRow()),
});

export const AudioOptionsDefine = v.pipe(
  v.intersect([
    v.pipe(
      v.object({
        isParagraph: isParagraphDefine,
        ...INTERVAL_DEFINE.entries,
      }),
      asRow(),
    ),
    SPEEDCONTROL_DEFINE,
  ]),
  asVirtualGroup(),
  asColumn(),
);
