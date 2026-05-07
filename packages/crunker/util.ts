import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
dayjs.extend(duration);

export function timeToStr(seconds: number) {
  return dayjs
    .duration(Math.round(seconds * 1000), 'milliseconds')
    .format('HH:mm:ss,SSS');
}
