import hbs1 from 'handlebars';
import { RootStaticInjectOptions } from 'static-injector';
import { uniqBy } from 'es-toolkit';
import type { SimplifiedState } from '@shenghuabi/lexical-textarea';
export class TemplateFormatService extends RootStaticInjectOptions {
  /** @deprecated */
  interpolate(input: string, value: Record<string, any>) {
    return hbs1.compile(input, { noEscape: true, preventIndent: true })(value, {
      allowProtoPropertiesByDefault: true,
    });
  }
  /** @deprecated */
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
    try {
      const astBody = hbs1.parse(input).body;
      const result = this.#getActionInputVariable(astBody, new Set());
      // 使用原始顺序构建 SimplifiedState（保留文本和变量的完整结构）
      return {
        list: [result.nodes] as SimplifiedState,
        error: false,
      };
    } catch {
      return { list: [], error: true };
    }
  }

  /** 将 SimplifiedState 反向还原为 handlebars 模板字符串 */
  unparse(simplified: SimplifiedState): string {
    const paragraphs = simplified.map((paragraph) => {
      let result = '';
      for (const node of paragraph) {
        if (node.type === 'text') {
          result += node.text;
        } else if (node.type === 'variable') {
          const path = node.item.value.join('.');
          result += `{{${path}}}`;
        }
      }
      return result;
    });
    // 多段落之间用换行分隔
    return paragraphs.join('\n');
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
    } catch {
      return {
        error: true,
        list: [],
      };
    }
  }

  #getActionInputVariable(body: hbs.AST.Node[], nowSet: Set<string>) {
    const obj = {
      set: new Set<string>(),
      block: {} as Record<string, any>,
      object: new Set<string>(),
      nodes: [] as SimplifiedState[number],
    };
    for (const item of body) {
      if ('type' in item && item.type === 'MustacheStatement') {
        const ms = item as hbs.AST.MustacheStatement;
        if (ms.path?.type === 'PathExpression') {
          const path = ms.path as hbs.AST.PathExpression;
          const parts = path.parts;
          const label = parts[0];
          obj.set.add(label);
          obj.object.add(label);
          // 添加变量节点，value 为完整路径
          obj.nodes.push({
            type: 'variable' as const,
            item: {
              label: label,
              value: parts as (string | number)[],
              type: 'custom',
            },
          });
        } else if (ms.path?.type === 'ThisExpression') {
          // {{this}} 等，直接作为变量
          obj.nodes.push({
            type: 'variable' as const,
            item: {
              label: 'this',
              value: ['this'],
              type: 'custom',
            },
          });
        }
      } else if ('type' in item && item.type === 'ContentStatement') {
        // handlebars ContentStatement -> 文本节点
        const cs = item as hbs.AST.ContentStatement;
        obj.nodes.push({
          type: 'text' as const,
          text: (cs.original ?? cs.value) as unknown as string,
        });
      } else if ('type' in item && item.type === 'CommentStatement') {
        // 忽略注释
        continue;
      } else if ('type' in item && item.type === 'BlockStatement') {
        // 递归处理块语句的子节点
        const bs = item as hbs.AST.BlockStatement;
        const blockResult = this.#getActionInputVariable(
          bs.program.body,
          new Set([...nowSet, ...obj.set]),
        );
        obj.nodes.push(...blockResult.nodes);
      } else if (
        'type' in item &&
        (item.type === 'PartialStatement' || item.type === 'SubExpression')
      ) {
        // 忽略部分表达式
        continue;
      }
    }
    return obj;
  }
}
