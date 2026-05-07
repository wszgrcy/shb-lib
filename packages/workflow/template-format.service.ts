import hbs1 from 'handlebars';
import { RootStaticInjectOptions } from 'static-injector';
import { uniqBy } from 'es-toolkit';
import { Liquid } from 'liquidjs';
import { ChatInput2 } from './share';
const engine = new Liquid({ jsTruthy: true });
type hbsStat = hbs.AST.BlockStatement | hbs.AST.MustacheStatement;
export class TemplateFormatService extends RootStaticInjectOptions {
  interpolate(input: string, value: Record<string, any>) {
    return hbs1.compile(input, { noEscape: true, preventIndent: true })(value, {
      allowProtoPropertiesByDefault: true,
    });
  }
  entryInterpolate(
    payload: Record<string, any>,
    knowledge: string,
    content: string,
    embedingTemplate?: {
      value?: string;
      enable: boolean;
    },
  ) {
    return embedingTemplate?.enable
      ? this.interpolate(embedingTemplate!.value ?? '', {
          ENTRY: { ...payload, knowledge },
        })
      : content;
  }
  /** 用于模板格式化 */
  parse(input: string) {
    let list;
    try {
      list = hbs1.parse(input).body;
    } catch (error) {
      return { list: [], error: true };
    }
    const result = this.#getActionInputVariable(list as any, new Set());
    return {
      list: [...result.set].map((item) => {
        if (result.object.has(item)) {
          return { inputType: 'object' as const, value: item };
        }
        return { inputType: 'string' as const, value: item };
      }) as ChatInput2[],
      error: false,
    };
  }
  // 只有条件用,没太大用途
  async parserJs(input: string) {
    const { createCssSelectorForTs } =
      await import('@cyia/code-util/selector/ts');
    try {
      const selector = createCssSelectorForTs(input, { scriptKind: 1 });

      // 1.无法准确区分object和string难度过大,即使区分了endsWith这种方法还是会被认为是Object<浪费时间
      const objectList = selector.queryAll(
        `:not(DotToken)+Identifier,*::children(0)[tag=Identifier]`,
      );

      return {
        list: uniqBy(objectList, (item) => item.value).map((item) => ({
          inputType: 'object' as const,
          value: item.value,
        })),
        error: false,
      };
    } catch (error) {
      return {
        error: true,
        list: [],
      };
    }
  }
  async parserLiquid(input: string) {
    try {
      const result = engine.parse(input);
      const varList = new Set<string>();
      const proxyObj = new Proxy(
        {},
        {
          getOwnPropertyDescriptor(target, p) {
            return undefined;
          },
          has(target, p) {
            varList.add(p as any);
            return true;
          },
        },
      );
      await engine.render(result, proxyObj);
      return {
        list: [...varList].map((item) => ({
          inputType: 'object' as const,
          value: item,
        })),
        error: false,
      };
    } catch (error) {
      return { error: true, list: [] };
    }
  }
  #getActionInputVariable(body: hbsStat[], nowSet: Set<string>) {
    const obj = {
      set: new Set<string>(),
      block: {} as Record<string, any>,
      object: new Set<string>(),
    };
    for (const item of body) {
      if (item.type === 'MustacheStatement') {
        if (item.path.type === 'PathExpression') {
          const path = item.path as hbs.AST.PathExpression;
          // 仅记录父级变量，也就是说允许传入对象，输入之类的
          obj.set.add(path.parts[0]);
          if (path.parts.length > 1) {
            obj.object.add(path.parts[0]);
          }
        } else {
        }
      } else {
        //if (item.type === 'BlockStatement')
        // if (item.path.original === 'if') {
        //   const ifVar = item.params[0].original as string;
        //   const result = getActionInputVariable(
        //     item.program.body,
        //     new Set([...nowSet, ...obj.set]) as any,
        //   );
        //   obj.block[ifVar] = result;
        // }
        // throw new Error(`不支持:${item.type}`);
      }
    }
    return obj;
  }
}
