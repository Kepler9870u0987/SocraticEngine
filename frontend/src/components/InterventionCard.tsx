/**
 * <InterventionCard /> — displays a single AI intervention as a q-card (PoC style).
 *
 * Socratica → shows domanda + sottotesto
 * Paradosso → shows paradosso + nucleo
 * Lente     → shows philosopher, lettura + spostamento
 *
 * During streaming: shows thinking animation.
 * After stream_end: shows parsed JSON fields.
 */

import type { Intervention } from '../hooks/useInterventions';
import './InterventionCard.css';

interface InterventionCardProps {
  intervention: Intervention;
  isStreaming?: boolean;
  onReaction?: (id: string, reaction: 'accept' | 'reject' | 'ignore') => void;
}

export default function InterventionCard({
  intervention,
  isStreaming = false,
  onReaction,
}: InterventionCardProps) {
  const { type, parsed, philosopher, triggerExcerpt, latencyMs, createdAt } = intervention;

  const now = createdAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  // Determine card type class + label
  const typeClass =
    type === 'socratica'
      ? 'q-card-socratica'
      : type === 'paradosso'
        ? 'q-card-paradosso'
        : 'q-card-lente';

  // ── Thinking state (streaming, no content yet or still accumulating JSON)
  if (isStreaming) {
    return (
      <div className="thinking-card">
        <div className="thinking-dots">
          <span /><span /><span />
        </div>
        <span className="thinking-text">la voce sta leggendo quello che hai scritto...</span>
      </div>
    );
  }

  // ── Error state
  if (intervention.status === 'error') {
    return (
      <div className={`q-card ${typeClass}`}>
        <div className="q-card-meta">
          <span className="q-card-trigger">errore</span>
          <span className="q-card-time">{now}</span>
        </div>
        <div className="q-card-question" style={{ color: 'var(--danger)', fontFamily: 'var(--font-machine)', fontSize: '0.8rem' }}>
          Generazione interrotta o errore. Riprova.
        </div>
        {onReaction && (
          <button className="q-card-dismiss" onClick={() => onReaction(intervention.id, 'ignore')}>✕</button>
        )}
      </div>
    );
  }

  // ── SOCRATICA card
  if (type === 'socratica') {
    const excerpt = triggerExcerpt
      ? (triggerExcerpt.length > 45 ? triggerExcerpt.substring(0, 45) + '…' : triggerExcerpt)
      : '';
    return (
      <div className={`q-card ${typeClass}`}>
        <div className="q-card-meta">
          {excerpt && <span className="q-card-trigger" title={triggerExcerpt}>↳ "{excerpt}"</span>}
          <span className="q-card-time">
            {now}{latencyMs ? ` · ${latencyMs}ms` : ''}
          </span>
        </div>
        <div className="q-card-question">
          {parsed?.domanda ?? intervention.content}
        </div>
        {parsed?.sottotesto && (
          <div className="q-card-undercut">{parsed.sottotesto}</div>
        )}
        {onReaction && (
          <button className="q-card-dismiss" onClick={() => onReaction(intervention.id, 'ignore')}>✕</button>
        )}
      </div>
    );
  }

  // ── PARADOSSO card
  if (type === 'paradosso') {
    return (
      <div className={`q-card ${typeClass}`}>
        <div className="q-card-meta">
          <span className="q-card-trigger">⊘ contraddizione interna</span>
          <span className="q-card-time">{now}</span>
        </div>
        <div className="q-card-question">
          {parsed?.paradosso ?? intervention.content}
        </div>
        {parsed?.nucleo && (
          <div className="q-card-nucleus">{parsed.nucleo}</div>
        )}
        {onReaction && (
          <button className="q-card-dismiss" onClick={() => onReaction(intervention.id, 'ignore')}>✕</button>
        )}
      </div>
    );
  }

  // ── LENTE card
  const philosopherName = philosopher
    ? philosopher.charAt(0).toUpperCase() + philosopher.slice(1)
    : 'Lente';

  return (
    <div className={`q-card ${typeClass}`}>
      <div className="q-card-meta">
        <span className="q-card-trigger">◈ {philosopherName}</span>
        <span className="q-card-time">{now}</span>
      </div>
      {parsed?.lettura && (
        <div className="q-card-reading">{parsed.lettura}</div>
      )}
      {parsed?.spostamento && (
        <div className="q-card-shift">{parsed.spostamento}</div>
      )}
      {!parsed?.lettura && !parsed?.spostamento && (
        <div className="q-card-question">{intervention.content}</div>
      )}
      {onReaction && (
        <button className="q-card-dismiss" onClick={() => onReaction(intervention.id, 'ignore')}>✕</button>
      )}
    </div>
  );
}

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
