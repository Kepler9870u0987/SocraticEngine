import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsApi, type DocumentDetailResponse } from '../api/client';
import { useInterventions } from '../hooks/useInterventions';
import InterventionPanel from '../components/InterventionPanel';
import VersionPanel from '../components/VersionPanel';
import LensToolbar from '../components/LensToolbar';
import ProseMirrorEditor, { type ProseMirrorEditorHandle } from '../components/ProseMirrorEditor';
import EditorToolbar from '../components/EditorToolbar';
import './EditorPage.css';

const AUTOSAVE_DELAY_MS = 3000;
const SILENCE_DELAY_MS  = 3000;
const MIN_WORDS         = 12;

/** Strip HTML tags to get plain text for word count and AI context. */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

/** Get selected text from a ProseMirror EditorView. */
function getSelectedText(view: import('prosemirror-view').EditorView | null): string {
  if (!view) return '';
  const { from, to } = view.state.selection;
  if (from === to) return '';
  return view.state.doc.textBetween(from, to, '\n');
}

export default function EditorPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate       = useNavigate();

  // ── Document state ──────────────────────────────────────────────
  const [doc,       setDoc]       = useState<DocumentDetailResponse | null>(null);
  const [content,   setContent]   = useState('');    // HTML content from ProseMirror
  const [plainText, setPlainText] = useState('');    // plain-text mirror for AI/counting
  const [title,     setTitle]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [rightTab,  setRightTab]  = useState<'voice' | 'versions'>('voice');

  // ── Silence / indicator state ───────────────────────────────────
  const [silenceProgress, setSilenceProgress]   = useState(0);
  const [indicatorState, setIndicatorState]     = useState<'idle' | 'counting' | 'thinking'>('idle');
  const silenceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceBarFrame   = useRef<number | null>(null);
  const silenceBarStart   = useRef<number | null>(null);

  // ── Paradox panel state ─────────────────────────────────────────
  const [paradoxOpen,      setParadoxOpen]      = useState(false);
  const [paradoxContent,   setParadoxContent]   = useState('');
  const [paradoxNucleus,   setParadoxNucleus]   = useState('');
  const [paradoxSelection, setParadoxSelection] = useState<string | null>(null);

  // ── Lens toolbar state ──────────────────────────────────────────
  const [lensVisible,    setLensVisible]    = useState(false);
  const [lensPos,        setLensPos]        = useState({ top: 0, left: 0 });
  const [lensSelected,   setLensSelected]   = useState('');
  const [selectionHint,  setSelectionHint]  = useState(false);

  // ── Lens drawer state ───────────────────────────────────────────
  const [lensDrawerOpen,         setLensDrawerOpen]         = useState(false);
  const [lensDrawerPhilosopher,  setLensDrawerPhilosopher]  = useState('');
  const [lensDrawerExcerpt,      setLensDrawerExcerpt]      = useState('');
  const [lensDrawerLettura,      setLensDrawerLettura]      = useState('');
  const [lensDrawerSpostamento,  setLensDrawerSpostamento]  = useState('');
  const [lensDrawerThinking,     setLensDrawerThinking]     = useState(false);

  const token          = useRef<string>(localStorage.getItem('access_token') ?? '');
  const autosaveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef     = useRef(content);
  const titleRef       = useRef(title);
  const pmRef          = useRef<ProseMirrorEditorHandle>(null);

  contentRef.current = content;
  titleRef.current   = title;

  // ── AI interventions ────────────────────────────────────────────
  const {
    interventions,
    streaming,
    wsStatus,
    triggerParadosso,
    triggerLente,
    sendTextActivity,
    abort,
    clearAll,
    setReaction,
  } = useInterventions(documentId, token.current);

  // Derive typed streams/results
  const socraticaInterventions = interventions.filter((i) => i.type === 'socratica');
  const socraticaStreaming      = streaming?.type === 'socratica' ? streaming : null;
  const paradossoStreaming      = streaming?.type === 'paradosso' ? streaming : null;
  const lenteStreaming          = streaming?.type === 'lente_filosofica' ? streaming : null;

  // Update silence indicator to 'thinking' while socratica streams
  useEffect(() => {
    if (streaming?.type === 'socratica') setIndicatorState('thinking');
    else if (indicatorState === 'thinking') setIndicatorState('idle');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming?.type]);

  // Watch paradosso interventions + streaming to update panel
  useEffect(() => {
    const latest = interventions.filter((i) => i.type === 'paradosso')[0];
    if (latest?.status === 'done') {
      setParadoxContent(latest.parsed?.paradosso ?? '');
      setParadoxNucleus(latest.parsed?.nucleo ?? '');
      setParadoxOpen(true);
    }
  }, [interventions]);

  useEffect(() => {
    if (paradossoStreaming) {
      setParadoxOpen(true);
      setParadoxContent('analisi in corso...');
      setParadoxNucleus('');
    }
  }, [paradossoStreaming]);

  // Watch lente interventions + streaming to update drawer
  useEffect(() => {
    const latest = interventions.filter((i) => i.type === 'lente_filosofica')[0];
    if (latest?.status === 'done') {
      setLensDrawerThinking(false);
      setLensDrawerLettura(latest.parsed?.lettura ?? '');
      setLensDrawerSpostamento(latest.parsed?.spostamento ?? '');
      setLensDrawerOpen(true);
    }
  }, [interventions]);

  useEffect(() => {
    if (lenteStreaming) {
      setLensDrawerThinking(true);
    }
  }, [lenteStreaming]);

  // ── Load document ───────────────────────────────────────────────
  useEffect(() => {
    if (!documentId) return;
    loadDocument(documentId);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [documentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDocument = async (id: string) => {
    try {
      const data = await documentsApi.get(id);
      setDoc(data);
      setContent(data.content);           // HTML for ProseMirror
      setPlainText(stripHtml(data.content)); // plain text for counting/AI
      setTitle(data.title);
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ── Autosave ────────────────────────────────────────────────────
  const saveDocument = useCallback(async () => {
    if (!documentId) return;
    try {
      const updated = await documentsApi.update(documentId, {
        title: titleRef.current,
        content: contentRef.current,
      });
      setDoc(updated);
    } catch { /* silent */ }
  }, [documentId]);

  // ── Version rollback ────────────────────────────────────────────
  const handleRollback = useCallback((updated: DocumentDetailResponse) => {
    setDoc(updated);
    setContent(updated.content);
    setPlainText(stripHtml(updated.content));
    setTitle(updated.title);
    setRightTab('voice');
  }, []);

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(saveDocument, AUTOSAVE_DELAY_MS);
  }, [saveDocument]);

  // ── Silence bar animation ───────────────────────────────────────
  function startSilenceBar() {
    silenceBarStart.current = Date.now();
    animateSilenceBar();
  }

  function animateSilenceBar() {
    if (!silenceBarStart.current) return;
    const elapsed = Date.now() - silenceBarStart.current;
    const pct = Math.min((elapsed / SILENCE_DELAY_MS) * 100, 100);
    setSilenceProgress(pct);
    if (pct < 100) {
      silenceBarFrame.current = requestAnimationFrame(animateSilenceBar);
    }
  }

  function resetSilenceBar() {
    silenceBarStart.current = null;
    if (silenceBarFrame.current) cancelAnimationFrame(silenceBarFrame.current);
    setSilenceProgress(0);
  }

  // ── ProseMirror change handler ────────────────────────────────
  const handleEditorChange = useCallback((html: string) => {
    setContent(html);
    const plain = stripHtml(html);
    setPlainText(plain);
    scheduleAutosave();
    sendTextActivity(plain);

    // Reset silence bar & start counting
    clearTimeout(silenceTimerRef.current ?? undefined);
    resetSilenceBar();

    const wc = countWords(plain);
    if (wc < MIN_WORDS) {
      setIndicatorState('idle');
      return;
    }

    setIndicatorState('counting');
    startSilenceBar();

    silenceTimerRef.current = setTimeout(() => {
      // sendTextActivity already handles the actual WS trigger
      setIndicatorState('idle');
      resetSilenceBar();
    }, SILENCE_DELAY_MS);
  }, [scheduleAutosave, sendTextActivity]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    scheduleAutosave();
  };

  // ── Paradox button ──────────────────────────────────────────────
  const handleParadox = () => {
    const view = pmRef.current?.getView() ?? null;
    const sel = getSelectedText(view);
    let text = '';
    let isSelection = false;
    if (sel.length > 0) {
      text = sel.trim();
      isSelection = true;
    } else {
      text = plainText.trim();
    }
    if (countWords(text) < MIN_WORDS) {
      setParadoxOpen(true);
      setParadoxContent(
        isSelection
          ? 'Seleziona almeno qualche frase per trovare il paradosso della selezione.'
          : 'Scrivi almeno qualche frase prima di cercare il paradosso.',
      );
      setParadoxNucleus('');
      return;
    }
    setParadoxSelection(isSelection ? text : null);
    triggerParadosso(text);
  };

  // ── Text selection → Lens toolbar ──────────────────────────────
  const handleSelectionChange = useCallback(() => {
    const view = pmRef.current?.getView();
    if (!view) return;
    const sel = getSelectedText(view);

    if (sel.length > 15) {
      setLensSelected(sel);
      setSelectionHint(false);
      // Position toolbar near cursor
      const coords = view.coordsAtPos(view.state.selection.to);
      const editorRect = view.dom.getBoundingClientRect();
      const rawTop = coords.bottom + 8;
      const clamped = Math.min(Math.max(rawTop, editorRect.top + 8), window.innerHeight - 330);
      setLensPos({ top: clamped, left: Math.max(8, coords.left - 105) });
      setLensVisible(true);
    } else {
      setLensVisible(false);
      if (plainText.length > 30) setSelectionHint(true);
      else setSelectionHint(false);
    }
  }, [plainText]);

  // ── Lens apply ──────────────────────────────────────────────────
  const handleLensSelect = (philosopherKey: string) => {
    const philosopherName = philosopherKey.charAt(0).toUpperCase() + philosopherKey.slice(1);
    setLensDrawerPhilosopher(philosopherName);
    setLensDrawerExcerpt(lensSelected);
    setLensDrawerLettura('');
    setLensDrawerSpostamento('');
    setLensDrawerThinking(true);
    setLensDrawerOpen(true);
    triggerLente(plainText.trim(), philosopherKey, lensSelected);
  };

  // ── Ctrl+S in title input ───────────────────────────────────────
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveDocument();
    }
  };

  const wordCount = countWords(plainText);
  const silenceRemainingSecs =
    indicatorState === 'counting'
      ? Math.max(1, Math.ceil(SILENCE_DELAY_MS * (1 - silenceProgress / 100) / 1000))
      : null;

  if (loading) {
    return <div className="editor-loading">Caricamento...</div>;
  }

  return (
    <div className="editor-shell" onClick={() => setLensVisible(false)}>

      {/* ── Topbar ──────────────────────────────────────────── */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="wordmark">Editor Filosofico</span>
          <span className="mode-badge">co-writing · voce socratica</span>
          <button
            className="back-btn"
            onClick={() => { abort(); navigate('/dashboard'); }}
          >
            ← dashboard
          </button>
        </div>
        <div className="topbar-right">
          <div className={`silence-indicator ${indicatorState === 'counting' ? 'active' : indicatorState === 'thinking' ? 'thinking' : ''}`}>
            <div className="silence-dot" />
            <span>
              {indicatorState === 'counting'
                ? `silenzio... ${silenceRemainingSecs}s`
                : indicatorState === 'thinking' ? 'smontando' : 'in attesa'}
            </span>
          </div>
          <span className="word-count">
            {wordCount} {wordCount === 1 ? 'parola' : 'parole'}
          </span>
        </div>
      </div>

      {/* ── Main columns ────────────────────────────────────── */}
      <div className="columns">

        {/* ── Editor column ──────────────────────────────── */}
        <div className="editor-col">
          <div className="editor-col-header">
            <span className="col-label">Il tuo testo</span>
            <div className="editor-col-header-right">
              <span className={`selection-hint ${selectionHint ? 'visible' : ''}`}>
                ◈ seleziona testo → lente filosofica
              </span>
              <button
                className={`paradox-btn ${paradossoStreaming ? 'loading' : ''}`}
                disabled={!!paradossoStreaming}
                onClick={handleParadox}
                title="Seleziona del testo per analizzarne una parte, oppure clicca per analizzare tutto il documento"
              >
                {paradossoStreaming
                  ? '⊘ cercando...'
                  : '⊘ trova il paradosso'}
              </button>
            </div>
          </div>

          <input
            className="title-input"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            placeholder="Titolo (opzionale)"
            spellCheck={false}
          />

          <EditorToolbar view={pmRef.current?.getView() ?? null} />

          <div
            className="editor-prosemirror-container"
            onMouseUp={() => setTimeout(handleSelectionChange, 20)}
            onClick={(e) => e.stopPropagation()}
          >
            <ProseMirrorEditor
              ref={pmRef}
              key={doc?.id}
              initialContent={content}
              onChange={handleEditorChange}
              onCtrlS={saveDocument}
              placeholder="Inizia a scrivere. Smetti. La voce arriva nel silenzio."
            />
          </div>

          {/* Paradox panel */}
          <div className={`paradox-panel ${paradoxOpen ? 'open' : ''}`}>
            <div className="paradox-inner">
              <div className="paradox-inner-header">
                <span className="paradox-label">
                  {paradoxSelection ? '⊘ contraddizione della selezione' : '⊘ contraddizione interna'}
                </span>
                <button className="paradox-close" onClick={() => setParadoxOpen(false)}>✕</button>
              </div>
              {paradoxSelection && (
                <div className="paradox-selection-tag">
                  "{paradoxSelection.length > 80 ? paradoxSelection.substring(0, 80) + '…' : paradoxSelection}"
                </div>
              )}
              <div className={`paradox-content ${!paradoxContent || paradoxContent === 'analisi in corso...' ? 'empty' : ''}`}>
                {paradoxContent || 'Premi il bottone per trovare il paradosso nel tuo testo.'}
              </div>
              {paradoxNucleus && (
                <div className="paradox-nucleus">{paradoxNucleus}</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right panel: voice + versioni ──────────────── */}
        <div className="right-panel">
          <div className="right-panel-tabs">
            <button
              className={`rpanel-tab ${rightTab === 'voice' ? 'active' : ''}`}
              onClick={() => setRightTab('voice')}
            >
              Voce socratica
            </button>
            <button
              className={`rpanel-tab ${rightTab === 'versions' ? 'active' : ''}`}
              onClick={() => setRightTab('versions')}
            >
              Versioni
            </button>
          </div>

          {rightTab === 'voice' ? (
            <InterventionPanel
              interventions={socraticaInterventions}
              streaming={socraticaStreaming}
              wsStatus={wsStatus}
              silenceProgress={silenceProgress}
              onClear={clearAll}
              onReaction={setReaction}
            />
          ) : (
            <VersionPanel
              documentId={documentId!}
              currentVersionNumber={doc?.version_number ?? 0}
              currentContent={content}
              onRollback={handleRollback}
            />
          )}
        </div>

      </div>

      {/* ── Lens toolbar (selection popup) ──────────────── */}
      <LensToolbar
        visible={lensVisible}
        top={lensPos.top}
        left={lensPos.left}
        onSelect={handleLensSelect}
        onClose={() => setLensVisible(false)}
      />

      {/* ── Lens result drawer ───────────────────────────── */}
      <div className={`lens-drawer ${lensDrawerOpen ? 'open' : ''}`}>
        <div className="lens-drawer-header">
          <div className="lens-drawer-header-left">
            <span className="lens-tag">◈ {lensDrawerPhilosopher}</span>
            <span className="lens-excerpt-tag">
              {lensDrawerExcerpt
                ? `"${lensDrawerExcerpt.length > 60 ? lensDrawerExcerpt.substring(0, 60) + '…' : lensDrawerExcerpt}"`
                : ''}
            </span>
          </div>
          <button className="lens-close" onClick={() => setLensDrawerOpen(false)}>✕ chiudi</button>
        </div>
        <div className="lens-drawer-body">
          {lensDrawerThinking ? (
            <div className="lens-thinking">
              <div className="lens-thinking-dots">
                <span /><span /><span />
              </div>
              <span className="lens-thinking-text">{lensDrawerPhilosopher} sta leggendo il passaggio...</span>
            </div>
          ) : (
            <>
              {lensDrawerLettura && (
                <div className="lens-result-reading">{lensDrawerLettura}</div>
              )}
              {lensDrawerSpostamento && (
                <div className="lens-result-shift">{lensDrawerSpostamento}</div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}

