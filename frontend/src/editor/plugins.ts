/**
 * ProseMirror plugin setup for the Socratic Editor.
 *
 * Returns the default set of plugins: keymap, history, drop/gap cursor, input rules.
 */

import { keymap } from 'prosemirror-keymap';
import { history } from 'prosemirror-history';
import { baseKeymap } from 'prosemirror-commands';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { buildKeymap } from 'prosemirror-example-setup';
import { buildInputRules } from 'prosemirror-example-setup';
import { Plugin } from 'prosemirror-state';
import { editorSchema } from './schema';

export function createPlugins(): Plugin[] {
  return [
    buildInputRules(editorSchema),
    keymap(buildKeymap(editorSchema)),
    keymap(baseKeymap),
    dropCursor(),
    gapCursor(),
    history(),
  ];
}
