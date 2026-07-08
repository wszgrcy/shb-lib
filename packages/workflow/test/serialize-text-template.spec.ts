import { expect } from 'chai';
import type { ChatMetadata } from '../share/type';
import { serializeLexicalTextarea } from '../util/serialize-text-template';
import type { SimplifiedState } from '@shenghuabi/lexical-textarea';

/** ChatDataRef 模拟对象，带有 toString 和 ref */
function createRefObj(val: string, ref: ChatMetadata): ChatMetadata {
  return Object.defineProperties(
    { ref, display: val },
    { toString: { value: () => val, enumerable: false } },
  ) as unknown as ChatMetadata;
}

/** 辅助函数：构建只有变量节点的单段落 input */
function varInput(path: string, customType?: string): SimplifiedState {
  return [
    [
      {
        type: 'variable' as const,
        item: { label: path, value: path.split('.'), type: customType },
      },
    ],
  ];
}

/** 辅助函数：构建文本+变量的段落 */
function textVarInput(text: string, varPath: string): SimplifiedState {
  return [
    [
      { type: 'text' as const, text },
      {
        type: 'variable' as const,
        item: { label: varPath, value: varPath.split('.'), type: undefined },
      },
    ],
  ];
}

describe('serializeLexicalTextarea', () => {
  it('should return string input as-is', () => {
    const result = serializeLexicalTextarea('hello world', {
      context: {},
      environmentContext: {},
    });
    expect(result).eq('hello world');
  });

  it('should resolve simple string from context', () => {
    const result = serializeLexicalTextarea(varInput('name'), {
      context: { name: 'world' },
      environmentContext: {},
    });
    expect(result).eq('world');
  });

  it('should resolve array of strings with newlines', () => {
    const result = serializeLexicalTextarea(varInput('list'), {
      context: { list: ['a', 'b', 'c'] },
      environmentContext: {},
    });
    expect(result).eq('a\nb\nc');
  });

  it('should resolve nested array (2 levels)', () => {
    const result = serializeLexicalTextarea(varInput('matrix'), {
      context: {
        matrix: [
          ['a', 'b'],
          ['c', 'd'],
        ],
      },
      environmentContext: {},
    });
    expect(result).eq('a\nb\nc\nd');
  });

  it('should resolve deeply nested array (3 levels)', () => {
    const result = serializeLexicalTextarea(varInput('deep'), {
      context: { deep: [['a', ['b', 'c']], 'd'] },
      environmentContext: {},
    });
    expect(result).eq('a\nb\nc\nd');
  });

  it('should resolve mixed array with objects containing ref', () => {
    const metadata: ChatMetadata[] = [];
    const obj1 = createRefObj('obj1', {
      type: 'dict',
      description: 'test',
      reference: { type: 'dict', word: 'w', content: 'c' },
    });
    const items = ['hello', obj1, 42];
    const result = serializeLexicalTextarea(varInput('items'), {
      context: { items },
      environmentContext: {},
      onMetadata: (meta) => metadata.push(...meta),
    });
    expect(result).eq('hello\nobj1\n42');
    expect(metadata.length).to.be.gte(1);
    expect(metadata[0]).to.include({ type: 'dict' });
  });

  it('should resolve nested array with objects containing ref', () => {
    const metadata: ChatMetadata[] = [];
    const obj1 = createRefObj('obj1', {
      type: 'dict',
      description: 'test',
      reference: { type: 'dict', word: 'w', content: 'c' },
    });
    const items = [['a', obj1], ['b']];
    const result = serializeLexicalTextarea(varInput('items'), {
      context: { items },
      environmentContext: {},
      onMetadata: (meta) => metadata.push(...meta),
    });
    expect(result).eq('a\nobj1\nb');
    expect(metadata.length).to.be.gte(1);
  });

  it('should handle ref array in object', () => {
    const metadata: ChatMetadata[] = [];
    const refObjs = [
      createRefObj('a', {
        type: 'dict',
        description: 'test',
        reference: { type: 'dict', word: 'w', content: 'c' },
      }),
      createRefObj('b', {
        type: 'dict',
        description: 'test',
        reference: { type: 'dict', word: 'w', content: 'c' },
      }),
    ];
    serializeLexicalTextarea(varInput('item'), {
      context: { item: refObjs },
      environmentContext: {},
      onMetadata: (meta) => metadata.push(...meta),
    });
    expect(metadata.length).to.be.gte(2);
  });

  it('should handle custom type item from environmentContext', () => {
    const input = varInput('env.val', 'custom');
    const result = serializeLexicalTextarea(input, {
      context: {},
      environmentContext: { env: { val: 'custom-result' } },
    });
    expect(result).eq('custom-result');
  });

  it('should handle undefined value from missing key', () => {
    const result = serializeLexicalTextarea(varInput('missing'), {
      context: {},
      environmentContext: {},
    });
    expect(result).eq('undefined');
  });

  it('should handle null explicitly', () => {
    const result = serializeLexicalTextarea(varInput('val'), {
      context: { val: null },
      environmentContext: {},
    });
    expect(result).eq('null');
  });

  it('should handle number values', () => {
    const result = serializeLexicalTextarea(varInput('num'), {
      context: { num: 123 },
      environmentContext: {},
    });
    expect(result).eq('123');
  });

  it('should recursively handle deeply nested object with ref in array', () => {
    const metadata: ChatMetadata[] = [];
    const objX = createRefObj('x', {
      type: 'dict',
      description: 'test',
      reference: { type: 'dict', word: 'w', content: 'c' },
    });
    const objY = createRefObj('y', {
      type: 'dict',
      description: 'test',
      reference: { type: 'dict', word: 'w', content: 'c' },
    });
    const deep = [[objX, ['nested', objY]]];
    const result = serializeLexicalTextarea(varInput('deep'), {
      context: { deep },
      environmentContext: {},
      onMetadata: (meta) => metadata.push(...meta),
    });
    expect(result).eq('x\nnested\ny');
    expect(metadata.length).to.be.gte(2);
  });

  it('should handle empty array', () => {
    const result = serializeLexicalTextarea(varInput('val'), {
      context: { val: [] },
      environmentContext: {},
    });
    expect(result).eq('');
  });

  it('should handle array with single undefined element', () => {
    const result = serializeLexicalTextarea(varInput('val'), {
      context: { val: [undefined] },
      environmentContext: {},
    });
    expect(result).eq('undefined');
  });

  it('should resolve nested object properties via path', () => {
    const result = serializeLexicalTextarea(varInput('a.b.c'), {
      context: { a: { b: { c: 'deep-value' } } },
      environmentContext: {},
    });
    expect(result).eq('deep-value');
  });

  it('should resolve nested array path', () => {
    const result = serializeLexicalTextarea(varInput('matrix'), {
      context: { matrix: [['a'], ['b'], ['c']] },
      environmentContext: {},
    });
    expect(result).eq('a\nb\nc');
  });

  it('should concatenate text node before variable', () => {
    const result = serializeLexicalTextarea(textVarInput('prefix:', 'name'), {
      context: { name: 'world' },
      environmentContext: {},
    });
    expect(result).eq('prefix:world');
  });

  it('should handle multiple paragraphs with newlines between', () => {
    const input = [
      [
        {
          type: 'variable' as const,
          item: { label: 'a', value: ['a'], type: undefined },
        },
      ],
      [
        {
          type: 'variable' as const,
          item: { label: 'b', value: ['b'], type: undefined },
        },
      ],
    ] as SimplifiedState;
    const result = serializeLexicalTextarea(input, {
      context: { a: 'line1', b: 'line2' },
      environmentContext: {},
    });
    expect(result).eq('line1\nline2');
  });

  it('should resolve object (not array) with ref', () => {
    const metadata: ChatMetadata[] = [];
    const obj = createRefObj('single', {
      type: 'dict',
      description: 'test',
      reference: { type: 'dict', word: 'w', content: 'c' },
    });
    const result = serializeLexicalTextarea(varInput('obj'), {
      context: { obj },
      environmentContext: {},
      onMetadata: (meta) => metadata.push(...meta),
    });
    expect(result).eq('single');
    expect(metadata.length).to.be.gte(1);
  });

  it('should handle number in nested array', () => {
    const result = serializeLexicalTextarea(varInput('vals'), {
      context: { vals: [[1, 2], [3]] },
      environmentContext: {},
    });
    expect(result).eq('1\n2\n3');
  });

  it('should handle deeply nested arrays with mixed types', () => {
    const metadata: ChatMetadata[] = [];
    const objB = createRefObj('b', {
      type: 'dict',
      description: 'test',
      reference: { type: 'dict', word: 'w', content: 'c' },
    });
    const objD = createRefObj('d', {
      type: 'dict',
      description: 'test',
      reference: { type: 'dict', word: 'w', content: 'c' },
    });
    const data = ['a', objB, [['c'], objD], 'e'];
    const result = serializeLexicalTextarea(varInput('data'), {
      context: { data },
      environmentContext: {},
      onMetadata: (meta) => metadata.push(...meta),
    });
    expect(result).eq('a\nb\nc\nd\ne');
    expect(metadata.length).to.be.gte(2);
  });

  describe('suffix property', () => {
    it('should resolve suffix as additional path segment after value', () => {
      const input = [
        [
          {
            type: 'variable' as const,
            item: { label: 'a.b', value: ['a'], suffix: 'b', type: undefined },
          },
        ],
      ] as SimplifiedState;
      const result = serializeLexicalTextarea(input, {
        context: { a: { b: 'suffix-result' } },
        environmentContext: {},
      });
      expect(result).eq('suffix-result');
    });

    it('should resolve suffix with nested path as string', () => {
      const input = [
        [
          {
            type: 'variable' as const,
            item: {
              label: 'a.b.c',
              value: ['a'],
              suffix: 'b.c',
              type: undefined,
            },
          },
        ],
      ] as SimplifiedState;
      const result = serializeLexicalTextarea(input, {
        context: { a: { b: { c: 'nested-suffix' } } },
        environmentContext: {},
      });
      expect(result).eq('nested-suffix');
    });

    it('should handle suffix with undefined result', () => {
      const input = [
        [
          {
            type: 'variable' as const,
            item: { label: 'a.x', value: ['a'], suffix: 'x', type: undefined },
          },
        ],
      ] as SimplifiedState;
      const result = serializeLexicalTextarea(input, {
        context: { a: {} },
        environmentContext: {},
      });
      expect(result).eq('undefined');
    });

    it('should handle empty suffix same as no suffix', () => {
      const input = [
        [
          {
            type: 'variable' as const,
            item: { label: 'a', value: ['a'], type: undefined },
          },
        ],
      ] as SimplifiedState;
      const result = serializeLexicalTextarea(input, {
        context: { a: 'direct-value' },
        environmentContext: {},
      });
      expect(result).eq('direct-value');
    });

    it('should concatenate suffix with value path', () => {
      const input = [
        [
          {
            type: 'variable' as const,
            item: {
              label: 'config.api.key',
              value: ['config', 'api'],
              suffix: 'key',
              type: undefined,
            },
          },
        ],
      ] as SimplifiedState;
      const result = serializeLexicalTextarea(input, {
        context: { config: { api: { key: 'secret123' } } },
        environmentContext: {},
      });
      expect(result).eq('secret123');
    });
  });
});
