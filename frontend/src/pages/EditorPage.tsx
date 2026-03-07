import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsApi } from '../api/client';
import { useInterventions } from '../hooks/useInterventions';
import InterventionPanel from '../components/InterventionPanel';
import LensToolbar from '../components/LensToolbar';
import './EditorPage.css';

const AUTOSAVE_DELAY_MS = 3000;
const SILENCE_DELAY_MS  = 3000;
const MIN_WORDS         = 12;

/** Strip HTML tags from ProseMirror-stored content so it displays cleanly in textarea. */
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

export default function EditorPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate       = useNavigate();

  // ── Document state ──────────────────────────────────────────────
  const [content,   setContent]   = useState('');
  const [title,     setTitle]     = useState('');
  const [loading,   setLoading]   = useState(true);

  // ── Silence / indicator state ───────────────────────────────────
  const [silenceProgress, setSilenceProgress]   = useState(0);
  const [indicatorState, setIndicatorState]     = useState<'idle' | 'counting' | 'thinking'>('idle');
  const silenceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceBarFrame   = useRef<number | null>(null);
  const silenceBarStart   = useRef<number | null>(null);

  // ── Paradox panel state ─────────────────────────────────────────
  const [paradoxOpen,     setParadoxOpen]     = useState(false);
  const [paradoxContent,  setParadoxContent]  = useState('');
  const [paradoxNucleus,  setParadoxNucleus]  = useState('');

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
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

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
      const plainText = stripHtml(data.content);
      setContent(plainText);
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
      await documentsApi.update(documentId, {
        title: titleRef.current,
        content: contentRef.current,
      });
    } catch { /* silent */ }
  }, [documentId]);

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

  // ── Input handler ───────────────────────────────────────────────
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    scheduleAutosave();
    sendTextActivity(val);

    // Reset silence bar & start counting
    clearTimeout(silenceTimerRef.current ?? undefined);
    resetSilenceBar();

    const wc = countWords(val);
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
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    scheduleAutosave();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveDocument();
    }
  };

  // ── Paradox button ──────────────────────────────────────────────
  const handleParadox = () => {
    const text = contentRef.current.trim();
    if (countWords(text) < MIN_WORDS) {
      setParadoxOpen(true);
      setParadoxContent('Scrivi almeno qualche frase prima di cercare il paradosso.');
      setParadoxNucleus('');
      return;
    }
    triggerParadosso(text);
  };

  // ── Text selection → Lens toolbar ──────────────────────────────
  const handleSelectionChange = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const sel   = ta.value.substring(start, end).trim();

    if (sel.length > 15) {
      setLensSelected(sel);
      setSelectionHint(false);
      // Position toolbar near selection
      const rect = ta.getBoundingClientRect();
      const lineHeight = 22;
      const linesBefore = ta.value.substring(0, end).split('\n').length;
      const rawTop = rect.top + linesBefore * lineHeight - ta.scrollTop + 8;
      const clamped = Math.min(Math.max(rawTop, rect.top + 8), window.innerHeight - 330);
      setLensPos({ top: clamped, left: Math.max(8, rect.left + rect.width / 2 - 105) });
      setLensVisible(true);
    } else {
      setLensVisible(false);
      if (contentRef.current.trim().length > 30) setSelectionHint(true);
      else setSelectionHint(false);
    }
  };

  // ── Lens apply ──────────────────────────────────────────────────
  const handleLensSelect = (philosopherKey: string) => {
    const philosopherName = philosopherKey.charAt(0).toUpperCase() + philosopherKey.slice(1);
    setLensDrawerPhilosopher(philosopherName);
    setLensDrawerExcerpt(lensSelected);
    setLensDrawerLettura('');
    setLensDrawerSpostamento('');
    setLensDrawerThinking(true);
    setLensDrawerOpen(true);
    triggerLente(contentRef.current.trim(), philosopherKey, lensSelected);
  };

  // ── Ctrl+S in title input ───────────────────────────────────────
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveDocument();
    }
  };

  const wordCount = countWords(content);

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
              {indicatorState === 'counting' ? 'silenzio...' : indicatorState === 'thinking' ? 'smontando' : 'in attesa'}
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
                title="Trova la contraddizione interna del tuo testo"
              >
                {paradossoStreaming ? '⊘ cercando...' : '⊘ trova il paradosso'}
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

          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onMouseUp={() => setTimeout(handleSelectionChange, 20)}
            onKeyUp={(e) => { if (e.shiftKey) setTimeout(handleSelectionChange, 20); }}
            onClick={(e) => e.stopPropagation()}
            placeholder="Inizia a scrivere. Smetti. La voce arriva nel silenzio."
            spellCheck={false}
          />

          {/* Paradox panel */}
          <div className={`paradox-panel ${paradoxOpen ? 'open' : ''}`}>
            <div className="paradox-inner">
              <span className="paradox-label">⊘ contraddizione interna</span>
              <div className={`paradox-content ${!paradoxContent || paradoxContent === 'analisi in corso...' ? 'empty' : ''}`}>
                {paradoxContent || 'Premi il bottone per trovare il paradosso nel tuo testo.'}
              </div>
              {paradoxNucleus && (
                <div className="paradox-nucleus">{paradoxNucleus}</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────── */}
        <div className="col-divider" />

        {/* ── Voice column ───────────────────────────────── */}
        <InterventionPanel
          interventions={socraticaInterventions}
          streaming={socraticaStreaming}
          wsStatus={wsStatus}
          silenceProgress={silenceProgress}
          onClear={clearAll}
          onReaction={setReaction}
        />

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

