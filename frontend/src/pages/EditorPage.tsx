import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsApi, type DocumentDetailResponse } from '../api/client';
import './EditorPage.css';

const AUTOSAVE_DELAY_MS = 3000;

export default function EditorPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentDetailResponse | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const titleRef = useRef(title);

  // Keep refs in sync
  contentRef.current = content;
  titleRef.current = title;

  useEffect(() => {
    if (!documentId) return;
    loadDocument(documentId);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [documentId]);

  const loadDocument = async (id: string) => {
    try {
      const data = await documentsApi.get(id);
      setDoc(data);
      setContent(data.content);
      setTitle(data.title);
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = useCallback(async () => {
    if (!documentId || saving) return;
    setSaving(true);
    try {
      const updated = await documentsApi.update(documentId, {
        title: titleRef.current,
        content: contentRef.current,
      });
      setDoc(updated);
      setLastSaved(new Date());
    } catch {
      // Handle error - could show notification
    } finally {
      setSaving(false);
    }
  }, [documentId, saving]);

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveDocument();
    }, AUTOSAVE_DELAY_MS);
  }, [saveDocument]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    scheduleAutosave();
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    scheduleAutosave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveDocument();
    }
  };

  if (loading) {
    return <div className="editor-loading">Loading document...</div>;
  }

  return (
    <div className="editor-page" onKeyDown={handleKeyDown}>
      {/* Header */}
      <header className="editor-header">
        <button className="btn-secondary editor-back" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>

        <input
          className="editor-title-input"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Document title..."
        />

        <div className="editor-status">
          {saving ? (
            <span className="status-saving">Saving...</span>
          ) : lastSaved ? (
            <span className="status-saved">
              Saved {lastSaved.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : null}
          <span className="status-version">v{doc?.version_number || 0}</span>
        </div>
      </header>

      {/* Editor Area */}
      <main className="editor-main">
        <div className="editor-content-area">
          <textarea
            className="editor-textarea"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Begin writing... The Socratic voice will challenge your assumptions."
            spellCheck
          />
        </div>

        {/* Interventions Panel (placeholder) */}
        <aside className="editor-sidebar">
          <div className="sidebar-header">
            <h3>Interventions</h3>
          </div>
          <div className="sidebar-empty">
            <p>AI interventions will appear here.</p>
            <p className="sidebar-hint">
              Voce Socratica, Paradosso, and Lenti Filosofiche coming soon.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
