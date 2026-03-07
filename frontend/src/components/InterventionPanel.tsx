/**
 * <InterventionPanel /> â€” the Socratic voice column (right side).
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
