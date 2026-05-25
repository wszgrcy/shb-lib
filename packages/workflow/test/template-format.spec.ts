import { expect } from 'chai';
import { TemplateFormatService } from '../template-format.service';
import type { SimplifiedState } from '@shenghuabi/lexical-textarea';

describe('TemplateFormatService', () => {
  let service: TemplateFormatService;

  beforeEach(() => {
    service = new TemplateFormatService();
  });

  describe('parse', () => {
    it('should return error when input is invalid handlebars syntax', () => {
      const result = service.parse('{{invalid');
      expect(result.error).to.eq(true);
      expect(result.list).to.deep.eq([]);
    });

    it('should parse simple mustache statement and return SimplifiedState', () => {
      const input = '{{name}}';
      const result = service.parse(input);
      
      expect(result.error).to.eq(false);
      expect(result.list).to.have.length(1);
      expect(result.list).to.be.an('array');
      
      // 检查 SimplifiedState 结构
      const list = result.list as SimplifiedState;
      expect(list).to.have.length(1); // 一个段落
      expect(list[0]).to.have.length(1); // 一个变量节点
      
      const node = list[0][0] as any;
      expect(node.type).to.eq('variable');
      expect(node.item.label).to.eq('name');
      expect(node.item.value).to.deep.eq(['name']);
    });

    it('should parse multiple variables in one template', () => {
      const input = '{{name}} is {{age}} years old';
      const result = service.parse(input);
      
      expect(result.error).to.eq(false);
      const list = result.list as SimplifiedState;
      // 保留完整结构：变量+文本
      expect(list).to.have.length(1);
      
      const variables = (list[0] as any[]).filter((node: any) => node.type === 'variable');
      expect(variables).to.have.length(2);
      
      const labels = variables.map((v: any) => v.item.label);
      expect(labels).to.include('name');
      expect(labels).to.include('age');
    });

    it('should mark path variables (with dots) as custom type', () => {
      const input = '{{user.name}} and {{user.email}}';
      const result = service.parse(input);
      
      expect(result.error).to.eq(false);
      const list = result.list as SimplifiedState;

      const variables = (list[0] as any[]).filter((node: any) => node.type === 'variable');
      // 保留完整结构（包括文本），有两个变量节点
      expect(variables).to.have.length(2);
      
      // 两个都是 user 开头的变量
      for (const node of variables) {
        expect(node.item.label).to.eq('user');
        expect(node.item.type).to.eq('custom');
      }
    });

    it('should mark simple variables as custom type', () => {
      const input = '{{title}} and {{content}}';
      const result = service.parse(input);
      
      expect(result.error).to.eq(false);
      const list = result.list as SimplifiedState;
      
      const nodes = list[0].filter(node => node.type === 'variable');
      for (const node of nodes) {
        // 简单变量应该是 custom 类型
        expect(node.item.type).to.eq('custom');
      }
    });

    it('should preserve all occurrences in SimplifiedState', () => {
      const input = '{{name}} {{name}} {{name}}';
      const result = service.parse(input);
      
      expect(result.error).to.eq(false);
      const list = result.list as SimplifiedState;
      
      const variables = (list[0] as any[]).filter((node: any) => node.type === 'variable');
      // 保留完整结构，有三个 name 变量
      expect(variables).to.have.length(3);
      for (const node of variables) {
        expect(node.item.label).to.eq('name');
      }
    });

    it('should handle complex template with multiple variables', () => {
      const input = 'Hello {{user.name}}, your order {{order.id}} is {{status}}';
      const result = service.parse(input);
      
      expect(result.error).to.eq(false);
      const list = result.list as SimplifiedState;
      
      const nodes = list[0].filter(node => node.type === 'variable');
      const labels = nodes.map(n => n.item.label);
      
      // 应该有 3 个唯一的变量: user, order, status
      expect(labels).to.include('user');
      expect(labels).to.include('order');
      expect(labels).to.include('status');
      
      // user 和 order 应该是 object 类型(有子属性)
      const userNode = nodes.find(n => n.item.label === 'user');
      const orderNode = nodes.find(n => n.item.label === 'order');
      expect(userNode?.item.type).to.eq('custom');
      expect(orderNode?.item.type).to.eq('custom');
      
      // status 应该是 custom 类型
      const statusNode = nodes.find(n => n.item.label === 'status');
      expect(statusNode?.item.type).to.eq('custom');
    });

    it('should return empty list for template with no variables', () => {
      const input = 'Hello world, no variables here';
      const result = service.parse(input);
      
      expect(result.error).to.eq(false);
      // 没有变量时，应该返回空的段落列表或只包含空数组的段落
      const list = result.list as SimplifiedState;
      // 如果没有找到任何变量，list 应该为空
      expect(list[0]).to.be.an('array');
    });

    it('should handle nested path expressions', () => {
      const input = '{{user.address.city}} and {{user.address.zip}}';
      const result = service.parse(input);
      
      expect(result.error).to.eq(false);
      const list = result.list as SimplifiedState;
      
      const variables = (list[0] as any[]).filter((node: any) => node.type === 'variable');
      // 保留完整结构，两个都是 user
      expect(variables).to.have.length(2);
      for (const node of variables) {
        expect(node.item.label).to.eq('user');
        expect(node.item.type).to.eq('custom');
      }
    });

    it('should handle mix of simple and object variables', () => {
      const input = '{{title}} {{user.name}} {{description}}';
      const result = service.parse(input);
      
      expect(result.error).to.eq(false);
      const list = result.list as SimplifiedState;
      
      const nodes = list[0].filter(node => node.type === 'variable');
      expect(nodes).to.have.length(3);
      
      const titleNode = nodes.find(n => n.item.label === 'title');
      const nodeName = nodes.find(n => n.item.label === 'user');
      const descNode = nodes.find(n => n.item.label === 'description');
      
      expect(titleNode?.item.type).to.eq('custom');
      expect(nodeName?.item.type).to.eq('custom');
      expect(descNode?.item.type).to.eq('custom');
    });

    it('should return full path as value for nested variables like {{a.b.c}}', () => {
      const input = '{{a.b.c}}';
      const result = service.parse(input);
      
      expect(result.error).to.eq(false);
      const list = result.list as SimplifiedState;
      
      const nodes = list[0].filter(node => node.type === 'variable');
      expect(nodes).to.have.length(1);
      
      const node = nodes[0];
      expect(node.item.label).to.eq('a');
      expect(node.item.value).to.deep.eq(['a', 'b', 'c']);
      expect(node.item.type).to.eq('custom');
    });

    it('should return full path as value for multiple nested variables', () => {
      const input = '{{user.profile.name}} and {{user.profile.age}}';
      const result = service.parse(input);
      
      expect(result.error).to.eq(false);
      const list = result.list as SimplifiedState;
      
      const variables = (list[0] as any[]).filter((node: any) => node.type === 'variable');
      // 保留完整结构，两个变量节点
      expect(variables).to.have.length(2);
      // 都指向 user
      for (const node of variables) {
        expect(node.item.label).to.eq('user');
        expect(node.item.type).to.eq('custom');
      }
    });

    it('should return self as value for simple variables', () => {
      const input = '{{name}} {{age}}';
      const result = service.parse(input);
      
      expect(result.error).to.eq(false);
      const list = result.list as SimplifiedState;
      
      const nodes = list[0].filter(node => node.type === 'variable');
      expect(nodes).to.have.length(2);
      
      // 简单变量的 value 应该只包含自身
      const nameNode = nodes.find(n => n.item.label === 'name');
      const ageNode = nodes.find(n => n.item.label === 'age');
      expect(nameNode?.item.value).to.deep.eq(['name']);
      expect(ageNode?.item.value).to.deep.eq(['age']);
    });
  });

describe('unparse', () => {
    it('should convert SimplifiedState back to template string for simple variable', () => {
      const input = '{{name}}';
      const parsed = service.parse(input);
      const output = service.unparse(parsed.list as SimplifiedState);
      expect(output).to.eq(input);
    });

    it('should convert SimplifiedState back to template string for nested variable', () => {
      const input = '{{a.b.c}}';
      const parsed = service.parse(input);
      const output = service.unparse(parsed.list as SimplifiedState);
      expect(output).to.eq(input);
    });

    it('should convert SimplifiedState back to template string with mixed content', () => {
      const input = 'Hello {{name}}, your order is {{order.status}}';
      const parsed = service.parse(input);
      const output = service.unparse(parsed.list as SimplifiedState);
      expect(output).to.eq(input);
    });

    it('should handle text nodes in SimplifiedState', () => {
      const simplified: SimplifiedState = [
        [{ type: 'text' as const, text: 'Hello ' }, { type: 'variable' as const, item: { label: 'name', value: ['name'], type: 'custom' } }, { type: 'text' as const, text: '!' }],
      ];
      const output = service.unparse(simplified);
      expect(output).to.eq('Hello {{name}}!');
    });

    it('should handle multi-paragraph SimplifiedState', () => {
      const simplified: SimplifiedState = [
        [{ type: 'text' as const, text: 'line1\n' }, { type: 'variable' as const, item: { label: 'a', value: ['a'], type: 'custom' } }],
        [{ type: 'text' as const, text: 'line2\n' }, { type: 'variable' as const, item: { label: 'b', value: ['b'], type: 'custom' } }],
        [{ type: 'text' as const, text: 'line3\n' }, { type: 'variable' as const, item: { label: 'c', value: ['c'], type: 'custom' } }],
      ];
      const output = service.unparse(simplified);
      // 多段落之间用 \n 分隔
      expect(output).to.eq('line1\n{{a}}\nline2\n{{b}}\nline3\n{{c}}');
    });

    it('should handle empty paragraphs in SimplifiedState', () => {
      const simplified: SimplifiedState = [
        [{ type: 'variable' as const, item: { label: 'a', value: ['a'], type: 'custom' } }],
        [],
        [{ type: 'text' as const, text: 'end' }],
      ];
      const output = service.unparse(simplified);
      expect(output).to.eq('{{a}}\n\nend');
    });

    it('should round-trip multi-paragraph SimplifiedState', () => {
      // 模拟从 Lexical 编辑器导出的多段落 SimplifiedState
      const simplified: SimplifiedState = [
        [
          { type: 'variable' as const, item: { label: 'user', value: ['user', 'name'], type: 'custom' } },
          { type: 'text' as const, text: ', your order is ' },
          { type: 'variable' as const, item: { label: 'order', value: ['order', 'status'], type: 'custom' } },
        ],
        [
          { type: 'variable' as const, item: { label: 'payment', value: ['payment', 'method'], type: 'custom' } },
        ],
      ];
      const output = service.unparse(simplified);
      expect(output).to.eq('{{user.name}}, your order is {{order.status}}\n{{payment.method}}');
    });

    it('should handle multiple different variables', () => {
      const input = '{{title}} and {{content}}';
      const parsed = service.parse(input);
      const output = service.unparse(parsed.list as SimplifiedState);
      expect(output).to.eq(input);
    });

    it('should handle empty template', () => {
      const input = '';
      const parsed = service.parse(input);
      const output = service.unparse(parsed.list as SimplifiedState);
      expect(output).to.eq(input);
    });

    it('should round-trip: str -> SimplifiedState -> str is equivalent', () => {
      const testCases = [
        '{{name}}',
        '{{a.b.c}}',
        'Hello {{world}}',
        '{{x}} {{y}} {{z}}',
        '{{user.profile.name}} and {{user.profile.age}}',
        'prefix{{a}}middle{{b}}suffix',
        '{{nested.deep.path.value}}',
        // 换行相关
        'line1\n{{name}}\nline3',
        '{{a}}\n{{b}}\n{{c}}',
        '\n{{name}}',
        '{{name}}\n',
        '\n\n{{x}}\n\n',
        'line1\n\nline2\n{{v}}\nline4',
      ];

      for (const template of testCases) {
        const parsed = service.parse(template);
        expect(parsed.error).to.eq(false);
        const reconstructed = service.unparse(parsed.list as SimplifiedState);
        expect(reconstructed).to.eq(template, `Failed for template: ${template}`);
      }
    });

    it('should round-trip: SimplifiedState -> str -> SimplifiedState is equivalent', () => {
      const testCases = [
        '{{name}}',
        '{{a.b.c}}',
        'Hello {{world}}',
        '{{user.profile.name}} and {{order.id}}',
      ];

      for (const template of testCases) {
        // SimplifiedState -> str
        const parsed1 = service.parse(template);
        expect(parsed1.error).to.eq(false);
        const str = service.unparse(parsed1.list as SimplifiedState);
        
        // str -> SimplifiedState
        const parsed2 = service.parse(str);
        expect(parsed2.error).to.eq(false);
        
        // 比较 SimplifiedState
        const originalList = parsed1.list as SimplifiedState;
        const restoredList = parsed2.list as SimplifiedState;
        
        for (let i = 0; i < originalList.length; i++) {
          expect(restoredList[i].length).to.eq(originalList[i].length, `Length mismatch at paragraph ${i} for template: ${template}`);
          for (let j = 0; j < originalList[i].length; j++) {
            const origNode = originalList[i][j];
            const restoredNode = restoredList[i][j];
            expect(restoredNode.type).to.eq(origNode.type, `Type mismatch at paragraph ${i} node ${j}`);
            if (origNode.type === 'variable') {
              expect((restoredNode as any).item.label).to.eq((origNode as any).item.label);
              expect((restoredNode as any).item.value).to.deep.eq((origNode as any).item.value);
            }
          }
        }
      }
    });
  });

  describe('interpolate', () => {
    it('should interpolate simple variables', () => {
      const input = 'Hello {{name}}';
      const result = service.interpolate(input, { name: 'World' });
      expect(result).to.eq('Hello World');
    });

    it('should interpolate object properties', () => {
      const input = 'Hello {{user.name}}';
      const result = service.interpolate(input, { user: { name: 'World' } });
      expect(result).to.eq('Hello World');
    });
  });
});
