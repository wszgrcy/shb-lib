/**
 * Chat fixture utilities for testing chat node configurations
 */

// Fixed properties for text nodes
const FIXED_TEXT = {
  detail: 0,
  format: 0,
  mode: 'normal' as const,
  style: '',
  type: 'text' as const,
  version: 1,
} as const;

// Fixed paragraph properties
const FIXED_PARAGRAPH = {
  direction: null,
  format: '',
  indent: 0,
  type: 'paragraph' as const,
  version: 1,
  textFormat: 0,
  textStyle: '',
} as const;

// Fixed root properties
const FIXED_ROOT = {
  direction: null,
  format: '',
  indent: 0,
  type: 'root' as const,
  version: 1,
} as const;

function createTextNode(text: string) {
  return {
    ...FIXED_TEXT,
    text,
  };
}

function createVariableNode(
  label: string,
  value: string[],
  options?: { type?: string },
) {
  return {
    type: 'variable' as const,
    version: 1,
    item: {
      label,
      value,
      type: options?.type,
    },
  };
}

function createVariableNodeWithoutType(label: string, value: string[]) {
  return createVariableNode(label, value);
}

function createParagraph(
  children: Array<
    | { text: string }
    | { label: string; value: string[]; type?: string; omitType?: boolean }
  >,
) {
  return {
    ...FIXED_PARAGRAPH,
    children: children.map((child) => {
      if ('text' in child) {
        return createTextNode(child.text);
      }
      if (child.omitType) {
        return createVariableNodeWithoutType(child.label, child.value);
      }
      return createVariableNode(
        child.label,
        child.value,
        child.type ? { type: child.type } : undefined,
      );
    }),
  };
}

function createRoot(
  paragraphs: Array<
    { text: string } | { label: string; value: string[]; type?: string }
  >[],
) {
  return {
    ...FIXED_ROOT,
    children: paragraphs.map((children) => createParagraph(children)),
  };
}

export function createTextTemplate(
  paragraphs: Array<
    | { text: string }
    | { label: string; value: string[]; type?: 'custom' | (string & {}) }
  >[],
) {
  return {
    root: createRoot(paragraphs),
  };
}
