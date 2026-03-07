/**
 * <InterventionPanel /> — the Socratic voice column (right side).
 *
 * PoC-style: just a feed of q-cards. No manual trigger buttons.
 * Auto-trigger happens via silence timer in EditorPage.
 * Paradosso and Lente are triggered from within the editor column.
 */

import type { Intervention } from '../hooks/useInterventions';
import InterventionCard from './InterventionCard';
import './InterventionPanel.css';

interface InterventionPanelProps {
  interventions: Intervention[];
  streaming: Intervention | null;
  wsStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  silenceProgress: number; // 0-100
  onClear: () => void;
  onReaction: (id: string, reaction: 'accept' | 'reject' | 'ignore') => void;
}

export default function InterventionPanel({
  interventions,
  streaming,
  wsStatus,
  silenceProgress,
  onClear,
  onReaction,
}: InterventionPanelProps) {
  const isEmpty = interventions.length === 0 && !streaming;

  return (
    <div className="voice-col">
      {/* Header */}
      <div className="voice-header">
        <span className="col-label">Voce socratica</span>
        <div className="voice-header-right">
          <span className={`ws-status-dot ws-${wsStatus}`} title={`WebSocket: ${wsStatus}`} />
          {interventions.length > 0 && (
            <button className="clear-btn" onClick={onClear}>Pulisci</button>
          )}
        </div>
      </div>

      {/* Silence progress bar */}
      <div className="silence-bar-wrap">
        <div className="silence-bar" style={{ width: `${silenceProgress}%` }} />
      </div>

      {/* Feed */}
      <div className="voice-feed">
        {isEmpty ? (
          <div className="voice-empty">
            <div className="voice-empty-symbol">?</div>
            <p>La voce si attiva dopo 3 secondi di silenzio. Non corregge. Non suggerisce. Smonta.</p>
          </div>
        ) : (
          <>
            {streaming && (
              <InterventionCard intervention={streaming} isStreaming />
            )}
            {[...interventions].map((item) => (
              <InterventionCard
                key={item.id}
                intervention={item}
                onReaction={onReaction}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

  { value: 'platone',     label: 'Platone' },
  { value: 'aristotele',  label: 'Aristotele' },
  { value: 'kant',        label: 'Kant' },
  { value: 'hegel',       label: 'Hegel' },
  { value: 'nietzsche',   label: 'Nietzsche' },
  { value: 'heidegger',   label: 'Heidegger' },
  { value: 'foucault',    label: 'Foucault' },
  { value: 'wittgenstein',label: 'Wittgenstein' },
] as const;

interface InterventionPanelProps {
  documentId: string;
  /** JWT retrieved from localStorage or auth context. */
  token: string;
  /** The current editor text – forwarded to WS on change. */
  editorText?: string;
}

export default function InterventionPanel({
  documentId,
  token,
  editorText = '',
}: InterventionPanelProps) {
  const [selectedPhilosopher, setSelectedPhilosopher] = useState<string>('kant');

  const {
    interventions,
    streaming,
    wsStatus,
    triggerSocratica,
    triggerParadosso,
    triggerLente,
    abort,
    clearAll,
    setReaction,
  } = useInterventions(documentId, token);

  const handleTriggerSocratica = useCallback(() => {
    triggerSocratica(editorText);
  }, [triggerSocratica, editorText]);

  const handleTriggerParadosso = useCallback(() => {
    triggerParadosso(editorText);
  }, [triggerParadosso, editorText]);

  const handleTriggerLente = useCallback(() => {
    triggerLente(editorText, selectedPhilosopher);
  }, [triggerLente, editorText, selectedPhilosopher]);

  const isGenerating = streaming !== null;

  return (
    <div className="intervention-panel">
      {/* ─── Status bar ─────────────────────────────────────── */}
      <div className="panel-statusbar">
        <span className={`ws-dot ws-${wsStatus}`} title={`WebSocket: ${wsStatus}`} />
        <span className="ws-label">
          {wsStatus === 'connected'  ? 'Connesso' :
           wsStatus === 'connecting' ? 'Connessione…' :
           wsStatus === 'error'      ? 'Errore WS' :
           'Disconnesso'}
        </span>
        {isGenerating && (
          <button className="btn-abort" onClick={abort} title="Interrompi generazione">
            ■ Stop
          </button>
        )}
        {interventions.length > 0 && (
          <button className="btn-clear" onClick={clearAll} title="Cancella interventi">
            Pulisci
          </button>
        )}
      </div>

      {/* ─── Manual trigger buttons ─────────────────────────── */}
      <div className="panel-triggers">
        <button
          className="trigger-btn btn-socratica"
          disabled={isGenerating || wsStatus !== 'connected'}
          onClick={handleTriggerSocratica}
        >
          Voce Socratica
        </button>

        <button
          className="trigger-btn btn-paradosso"
          disabled={isGenerating || wsStatus !== 'connected'}
          onClick={handleTriggerParadosso}
        >
          Paradosso
        </button>

        {/* Lente row: philosopher select + button */}
        <div className="lente-row">
          <select
            className="philosopher-select"
            value={selectedPhilosopher}
            onChange={e => setSelectedPhilosopher(e.target.value)}
            disabled={isGenerating || wsStatus !== 'connected'}
          >
            {PHILOSOPHERS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button
            className="trigger-btn btn-lente"
            disabled={isGenerating || wsStatus !== 'connected'}
            onClick={handleTriggerLente}
          >
            Lente
          </button>
        </div>
      </div>

      <div className="panel-divider" />

      {/* ─── Streaming card ─────────────────────────────────── */}
      {streaming && (
        <InterventionCard
          intervention={streaming}
          isStreaming
        />
      )}

      {/* ─── Completed interventions ────────────────────────── */}
      {interventions.length === 0 && !streaming && (
        <p className="panel-empty">
          Nessun intervento ancora.
          <br />
          <small>La Voce Socratica si attiva automaticamente dopo la scrittura.</small>
        </p>
      )}

      <div className="interventions-list">
        {[...interventions].reverse().map(item => (
          <InterventionCard
            key={item.id}
            intervention={item}
            onReaction={setReaction}
          />
        ))}
      </div>
    </div>
  );
}
