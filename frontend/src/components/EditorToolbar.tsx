/**
 * <EditorToolbar /> — formatting bar for the ProseMirror editor.
 *
 * Provides buttons for: B, I, Code, H1, H2, H3, Blockquote, BulletList,
 * OrderedList, HorizontalRule. Actions are dispatched to the active EditorView.
 */

import { EditorView } from 'prosemirror-view';
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { wrapInList } from 'prosemirror-schema-list';
import { editorSchema } from '../editor';

import './EditorToolbar.css';

interface EditorToolbarProps {
  view: EditorView | null;
}

function cmd(
  view: EditorView | null,
  command: (state: EditorView['state'], dispatch?: EditorView['dispatch']) => boolean,
) {
  if (!view) return;
  command(view.state, view.dispatch);
  view.focus();
}

export default function EditorToolbar({ view }: EditorToolbarProps) {
  const s = editorSchema;

  return (
    <div className="editor-toolbar">
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          title="Bold (Ctrl+B)"
          onMouseDown={(e) => {
            e.preventDefault();
            cmd(view, toggleMark(s.marks.strong));
          }}
        >
          <strong>B</strong>
        </button>
        <button
          className="toolbar-btn"
          title="Italic (Ctrl+I)"
          onMouseDown={(e) => {
            e.preventDefault();
            cmd(view, toggleMark(s.marks.em));
          }}
        >
          <em>I</em>
        </button>
        <button
          className="toolbar-btn"
          title="Code"
          onMouseDown={(e) => {
            e.preventDefault();
            cmd(view, toggleMark(s.marks.code));
          }}
        >
          {'</>'}
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          title="Heading 1"
          onMouseDown={(e) => {
            e.preventDefault();
            cmd(view, setBlockType(s.nodes.heading, { level: 1 }));
          }}
        >
          H1
        </button>
        <button
          className="toolbar-btn"
          title="Heading 2"
          onMouseDown={(e) => {
            e.preventDefault();
            cmd(view, setBlockType(s.nodes.heading, { level: 2 }));
          }}
        >
          H2
        </button>
        <button
          className="toolbar-btn"
          title="Heading 3"
          onMouseDown={(e) => {
            e.preventDefault();
            cmd(view, setBlockType(s.nodes.heading, { level: 3 }));
          }}
        >
          H3
        </button>
        <button
          className="toolbar-btn"
          title="Paragraph"
          onMouseDown={(e) => {
            e.preventDefault();
            cmd(view, setBlockType(s.nodes.paragraph));
          }}
        >
          ¶
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          title="Blockquote"
          onMouseDown={(e) => {
            e.preventDefault();
            cmd(view, wrapIn(s.nodes.blockquote));
          }}
        >
          ❝
        </button>
        <button
          className="toolbar-btn"
          title="Bullet List"
          onMouseDown={(e) => {
            e.preventDefault();
            cmd(view, wrapInList(s.nodes.bullet_list));
          }}
        >
          •
        </button>
        <button
          className="toolbar-btn"
          title="Ordered List"
          onMouseDown={(e) => {
            e.preventDefault();
            cmd(view, wrapInList(s.nodes.ordered_list));
          }}
        >
          1.
        </button>
        <button
          className="toolbar-btn"
          title="Horizontal Rule"
          onMouseDown={(e) => {
            e.preventDefault();
            if (!view) return;
            const { state, dispatch } = view;
            dispatch(state.tr.replaceSelectionWith(s.nodes.horizontal_rule.create()));
            view.focus();
          }}
        >
          ―
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          title="Undo (Ctrl+Z)"
          onMouseDown={(e) => {
            e.preventDefault();
            cmd(view, undo);
          }}
        >
          ↩
        </button>
        <button
          className="toolbar-btn"
          title="Redo (Ctrl+Y)"
          onMouseDown={(e) => {
            e.preventDefault();
            cmd(view, redo);
          }}
        >
          ↪
        </button>
      </div>
    </div>
  );
}
