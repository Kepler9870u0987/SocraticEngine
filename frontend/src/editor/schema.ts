/**
 * ProseMirror Schema for the Socratic Editor.
 *
 * Supports:
 * - Paragraphs, headings (1-3), blockquotes, horizontal rules
 * - Bold, italic, code marks
 * - Ordered and bullet lists
 * - Custom "intervention" mark used to highlight AI-generated text
 */

import { Schema, NodeSpec, MarkSpec } from 'prosemirror-model';
import { addListNodes } from 'prosemirror-schema-list';

/* ---------- node specs ---------- */

const baseNodes: Record<string, NodeSpec> = {
  doc: { content: 'block+' },

  paragraph: {
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM() {
      return ['p', 0];
    },
  },

  heading: {
    attrs: { level: { default: 1, validate: 'number' } },
    content: 'inline*',
    group: 'block',
    defining: true,
    parseDOM: [
      { tag: 'h1', attrs: { level: 1 } },
      { tag: 'h2', attrs: { level: 2 } },
      { tag: 'h3', attrs: { level: 3 } },
    ],
    toDOM(node) {
      return [`h${node.attrs.level}`, 0];
    },
  },

  blockquote: {
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM() {
      return ['blockquote', 0];
    },
  },

  horizontal_rule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM() {
      return ['hr'];
    },
  },

  hard_break: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() {
      return ['br'];
    },
  },

  text: { group: 'inline' },
};

/* ---------- mark specs ---------- */

const marks: Record<string, MarkSpec> = {
  strong: {
    parseDOM: [
      { tag: 'strong' },
      { tag: 'b', getAttrs: (node: HTMLElement) => node.style.fontWeight !== 'normal' && null },
      { style: 'font-weight=bold' },
      { style: 'font-weight=700' },
    ],
    toDOM() {
      return ['strong', 0];
    },
  },

  em: {
    parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
    toDOM() {
      return ['em', 0];
    },
  },

  code: {
    parseDOM: [{ tag: 'code' }],
    toDOM() {
      return ['code', 0];
    },
  },

  /**
   * Custom mark for AI interventions.
   * `type` = socratica | paradosso | lente
   * Rendered as a <span> with the appropriate CSS class.
   */
  intervention: {
    attrs: {
      type: { default: 'socratica' },
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'span[data-intervention]',
        getAttrs(dom: HTMLElement) {
          return { type: dom.getAttribute('data-intervention') || 'socratica' };
        },
      },
    ],
    toDOM(mark) {
      return [
        'span',
        {
          'data-intervention': mark.attrs.type,
          class: `intervention-${mark.attrs.type}`,
        },
        0,
      ];
    },
  },
};

/* ---------- build schema ---------- */

const nodesWithLists = addListNodes(
  new Schema({ nodes: baseNodes, marks }).spec.nodes,
  'paragraph block*',
  'block',
);

export const editorSchema = new Schema({ nodes: nodesWithLists, marks });
