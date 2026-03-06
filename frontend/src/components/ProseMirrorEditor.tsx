/**
 * <ProseMirrorEditor /> — React wrapper around ProseMirror.
 *
 * Props:
 *   initialContent  – HTML string to load when the editor mounts / doc changes
 *   onChange         – called with the HTML serialisation every time the doc changes
 *   onCtrlS         – optional hook for Ctrl+S save
 *   className       – extra CSS class on the outermost div
 */

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { DOMParser, DOMSerializer } from 'prosemirror-model';
import { editorSchema, createPlugins } from '../editor';

import 'prosemirror-view/style/prosemirror.css';
import './ProseMirrorEditor.css';

export interface ProseMirrorEditorHandle {
  getView(): EditorView | null;
}

interface ProseMirrorEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
  onCtrlS?: () => void;
  className?: string;
  placeholder?: string;
}

/* ---- helpers ---- */

function htmlToDoc(html: string) {
  const container = document.createElement('div');
  container.innerHTML = html || '<p></p>';
  return DOMParser.fromSchema(editorSchema).parse(container);
}

function docToHtml(view: EditorView): string {
  const fragment = DOMSerializer.fromSchema(editorSchema).serializeFragment(
    view.state.doc.content,
  );
  const container = document.createElement('div');
  container.appendChild(fragment);
  return container.innerHTML;
}

/* ---- component ---- */

const ProseMirrorEditor = forwardRef<ProseMirrorEditorHandle, ProseMirrorEditorProps>(
  function ProseMirrorEditor(
    { initialContent, onChange, onCtrlS, className, placeholder },
    ref,
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    const onCtrlSRef = useRef(onCtrlS);

    // Keep callback refs fresh without triggering re-creation
    onChangeRef.current = onChange;
    onCtrlSRef.current = onCtrlS;

    useImperativeHandle(ref, () => ({
      getView: () => viewRef.current,
    }));

    const createView = useCallback(() => {
      if (!editorRef.current) return;

    // Destroy any previous view
    viewRef.current?.destroy();

    const doc = htmlToDoc(initialContent);

    const state = EditorState.create({
      doc,
      plugins: createPlugins(),
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
        if (transaction.docChanged) {
          onChangeRef.current(docToHtml(view));
        }
      },
      handleKeyDown(_view, event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          event.preventDefault();
          onCtrlSRef.current?.();
          return true;
        }
        return false;
      },
      attributes: {
        class: 'socratic-prosemirror',
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    });

    viewRef.current = view;
  }, [initialContent]);

  /* Mount / unmount */
  useEffect(() => {
    createView();
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [createView]);

    return (
      <div className={`prosemirror-editor-wrapper ${className ?? ''}`}>
        <div ref={editorRef} />
      </div>
    );
  },
);

export default ProseMirrorEditor;
