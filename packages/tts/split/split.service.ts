import {
  createBeginChatRegexp,
  creatLeftChatRegexp,
  creatMayBeChatRegexp,
  creatRightChatRegexp,
} from './create-regexp';

const List = [
  ['“', '”'],
  ['‘', '’'],
  ['「', '」'],
  ['『', '』'],
];
const ChatList = List.flatMap((item) => [
  creatLeftChatRegexp(item[0], item[1]),
  createBeginChatRegexp(item[0], item[1]),
  creatRightChatRegexp(item[0], item[1]),
  creatMayBeChatRegexp(item[0], item[1]),
]);
const endReg = /(！！！|！！|？？？|？？|？！|。|？|！|……)$/;
const splitMultiLineReg = /^.+$/dgm;
// const segmenterZh = new Intl.Segmenter('zh-Hans', { granularity: 'word' });
const zhReg = /\p{Script=Hani}/gmu;
const engReg = /[\w\.,!?;:\(\)'"—–…\/-]/gu;

export interface ChatOptions {
  type: 'chat';
  fullStart: number;
  fullEnd: number;
  start: number;
  end: number;
  context?: string;
  content: string;
  language: string;
  isStart: boolean;
}

export type DefaultItem = {
  type: 'default';
  content: string;
  fullStart: number;
  fullEnd: number;
  start: number;
  end: number;
  language: string;
  isStart: boolean;
};
export type AnyItem = {
  type: 'any';
  content: string;
  language?: string;
  context?: string;
};
export type ParsedItem = ChatOptions | DefaultItem;
export function detectLanguage(content: string) {
  const length = content.length;
  let matchResult = content.match(zhReg);
  let percent = matchResult?.length ?? 0 / length;
  if (percent >= 0.2) {
    return 'chinese';
  }
  matchResult = content.match(engReg);
  percent = matchResult?.length ?? 0 / length;
  if (percent >= 0.5) {
    return 'english';
  }
  return 'chinese';
}
// 需要根据长度分
export class SplitService {
  chatList: ChatOptions[] = [];
  splitList: ParsedItem[] = [];
  lineStartList = new Set();
  run(str: string) {
    this.lineStartList = new Set();
    this.chatList = [];
    this.splitList = [];
    let lineResult;
    while ((lineResult = splitMultiLineReg.exec(str))) {
      this.lineStartList.add(lineResult.indices![0]![0]);
    }
    this.chatMatch(str);
    let index = 0;
    if (this.chatList.length) {
      for (let i = 0; i < this.chatList.length; i++) {
        const item = this.chatList[i];
        const content = str.slice(index, item.fullStart);
        let result;

        while ((result = splitMultiLineReg.exec(content))) {
          const subContent = content.slice(
            result.indices![0]![0],
            result.indices![0]![1],
          );
          if (!subContent.trim()) {
            continue;
          }
          detectLanguage(subContent);

          this.splitList.push({
            type: 'default',
            content: subContent,
            fullStart: index + result.indices![0]![0],
            fullEnd: index + result.indices![0]![1],
            start: index + result.indices![0]![0],
            end: index + result.indices![0]![1],
            language: detectLanguage(subContent),
            isStart: this.lineStartList.has(index + result.indices![0]![0]),
          });
        }
        this.splitList.push(item);
        index = item.fullEnd;
      }
    }
    if (index !== str.length) {
      let result;
      const content = str.slice(index);
      while ((result = splitMultiLineReg.exec(content))) {
        const subContent = content.slice(
          result.indices![0]![0],
          result.indices![0]![1],
        );
        if (!subContent.trim()) {
          continue;
        }
        detectLanguage(subContent);

        this.splitList.push({
          type: 'default',
          content: subContent,
          fullStart: index + result.indices![0]![0],
          fullEnd: index + result.indices![0]![1],
          start: index + result.indices![0]![0],
          end: index + result.indices![0]![1],
          language: detectLanguage(subContent),
          isStart: this.lineStartList.has(index + result.indices![0]![0]),
        });
      }
    }
    return this.splitList;
  }
  chatMatch(str: string) {
    let index = 0;
    while (true) {
      let matched = false;
      for (const regexp of ChatList) {
        regexp.lastIndex = index;
        const result = regexp.exec(str);
        if (result) {
          matched = true;
          const chatContentIndex = result.indices!.groups!['content'];
          const chatContent = str.slice(
            chatContentIndex[0],
            chatContentIndex[1],
          );
          const chatContextRange = result.indices!.groups!['chatContext'];
          let chatContextContent: string | undefined;
          if (chatContextRange) {
            chatContextContent = str.slice(
              chatContextRange[0],
              chatContextRange[1],
            );
          }
          endReg.lastIndex = 0;
          const endResult = endReg.exec(chatContent);
          const nextIndex = chatContentIndex[1] - (endResult?.[0].length ?? 0);
          index = nextIndex;
          if (!chatContent.trim()) {
            continue;
          }
          this.chatList.push({
            start: result.indices!.groups!['content'][0],
            end: result.indices!.groups!['content'][1],
            fullStart: result.indices!.groups!['chatStartTag'][0],
            fullEnd: result.indices!.groups!['chatEndTag'][1],
            content: chatContent,
            context: chatContextContent,
            type: 'chat',
            language: detectLanguage(chatContent),
            isStart: this.lineStartList.has(
              result.indices!.groups!['chatStartTag'][0],
            ),
          });
          break;
        }
      }
      if (!matched) {
        break;
      }
    }
  }
}
