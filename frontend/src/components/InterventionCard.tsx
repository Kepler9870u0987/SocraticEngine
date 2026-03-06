/**
 * <InterventionCard /> — displays a single AI intervention.
 *
 * Renders the markdown-ish content from Socratica / Paradosso / Lente
 * with the appropriate philosophical colour coding.
 */

import { useState } from 'react';
import type { Intervention } from '../hooks/useInterventions';
import './InterventionCard.css';

const TYPE_LABELS: Record<string, string> = {
  socratica: 'Voce Socratica',
  paradosso: 'Paradosso',
  lente_filosofica: 'Lente',
};

interface InterventionCardProps {
  intervention: Intervention;
  isStreaming?: boolean;
  onReaction?: (id: string, reaction: 'accept' | 'reject' | 'ignore') => void;
}

/** Very light markdown-to-HTML renderer for the intervention outputs.
 *  Handles **bold** + line breaks only — no external dependency needed. */
function renderContent(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export default function InterventionCard({
  intervention,
  isStreaming = false,
  onReaction,
}: InterventionCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const typeClass =
    intervention.type === 'socratica'
      ? 'card-socratica'
      : intervention.type === 'paradosso'
        ? 'card-paradosso'
        : 'card-lente';

  const label = TYPE_LABELS[intervention.type] ?? intervention.type;
  const title =
    intervention.type === 'lente_filosofica' && intervention.philosopher
      ? `Lente — ${intervention.philosopher}`
      : label;

  return (
    <div className={`intervention-card ${typeClass} ${isStreaming ? 'is-streaming' : ''}`}>
      {/* Header */}
      <div className="card-header">
        <span className="card-type">{title}</span>
        <div className="card-meta">
          {intervention.latencyMs && (
            <span className="card-latency">{intervention.latencyMs}ms</span>
          )}
          {!isStreaming && (
            <button
              className="card-dismiss"
              onClick={() => {
                onReaction?.(intervention.id, 'ignore');
                setDismissed(true);
              }}
              title="Chiudi"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="card-content"
        dangerouslySetInnerHTML={{ __html: renderContent(intervention.content) }}
      />

      {/* Streaming cursor */}
      {isStreaming && <span className="card-cursor" />}

      {/* Reaction buttons (only when done) */}
      {!isStreaming && intervention.status === 'done' && onReaction && (
        <div className="card-reactions">
          <button
            className="reaction-btn reaction-accept"
            title="Accetta questa critica"
            onClick={() => onReaction(intervention.id, 'accept')}
          >
            ✓ Accolgo
          </button>
          <button
            className="reaction-btn reaction-reject"
            title="Respingi questa critica"
            onClick={() => {
              onReaction(intervention.id, 'reject');
              setDismissed(true);
            }}
          >
            ✕ Non mi convince
          </button>
        </div>
      )}

      {/* Error state */}
      {intervention.status === 'error' && (
        <div className="card-error">Generazione interrotta.</div>
      )}
    </div>
  );
}
