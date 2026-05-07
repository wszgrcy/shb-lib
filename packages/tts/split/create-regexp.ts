const EndText = `！！！|！！|？？？|？？|？！|。|？|！|……`;
const ChatEndText = `！！！”|！！”|？？？”|？？”|？！”|。”|？”|！”`;
export function createBeginChatRegexp(left: string, right: string) {
  return new RegExp(
    `^(?<chatContext>.+?)：(?<chatStartTag>${left})(?<content>.+?)(?<chatEndTag>${right})`,
    'dgmu',
  );
}
/** 左侧对话xxx.:"" */
export function creatLeftChatRegexp(left: string, right: string) {
  return new RegExp(
    `(?<preEnd>${ChatEndText}|${EndText})(?<chatContext>(.(?!(${ChatEndText}|${EndText})))+?)：(?<chatStartTag>${left})(?<content>.+?)(?<chatEndTag>${right})`,
    'dgu',
  );
}
/** 右侧对话""xxx */
export function creatRightChatRegexp(left: string, right: string) {
  return new RegExp(
    `(?<chatStartTag>${left})(?<content>.+?)(?<chatEndTag>${right})(?<chatContext>.+?)(${EndText})`,
    'dgu',
  );
}
export function creatMayBeChatRegexp(left: string, right: string) {
  return new RegExp(
    `(?<chatStartTag>${left})(?<content>.+?(${EndText}))(?<chatEndTag>${right})`,
    'dgu',
  );
}
