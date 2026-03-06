/**
 * <InterventionPanel /> — the AI interventions sidebar.
 *
 * Wraps useInterventions, shows streaming + completed cards,
 * and exposes manual trigger buttons.
 */

import { useState, useCallback } from 'react';
import { useInterventions } from '../hooks/useInterventions';
import InterventionCard from './InterventionCard';
import './InterventionPanel.css';

const PHILOSOPHERS = [
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
