/**
 * <InterventionCard /> â€” displays a single AI intervention as a q-card (PoC style).
 *
 * Socratica â†’ shows domanda + sottotesto
 * Paradosso â†’ shows paradosso + nucleo
 * Lente     â†’ shows philosopher, lettura + spostamento
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

  // â”€â”€ Thinking state (streaming, no content yet or still accumulating JSON)
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

  // â”€â”€ Error state
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
          <button className="q-card-dismiss" onClick={() => onReaction(intervention.id, 'ignore')}>âœ•</button>
        )}
      </div>
    );
  }

  // â”€â”€ SOCRATICA card
  if (type === 'socratica') {
    const excerpt = triggerExcerpt
      ? (triggerExcerpt.length > 45 ? triggerExcerpt.substring(0, 45) + 'â€¦' : triggerExcerpt)
      : '';
    return (
      <div className={`q-card ${typeClass}`}>
        <div className="q-card-meta">
          {excerpt && <span className="q-card-trigger" title={triggerExcerpt}>â†³ "{excerpt}"</span>}
          <span className="q-card-time">
            {now}{latencyMs ? ` Â· ${latencyMs}ms` : ''}
          </span>
        </div>
        <div className="q-card-question">
          {parsed?.domanda ?? intervention.content}
        </div>
        {parsed?.sottotesto && (
          <div className="q-card-undercut">{parsed.sottotesto}</div>
        )}
        {onReaction && (
          <button className="q-card-dismiss" onClick={() => onReaction(intervention.id, 'ignore')}>âœ•</button>
        )}
      </div>
    );
  }

  // â”€â”€ PARADOSSO card
  if (type === 'paradosso') {
    return (
      <div className={`q-card ${typeClass}`}>
        <div className="q-card-meta">
          <span className="q-card-trigger">âŠ˜ contraddizione interna</span>
          <span className="q-card-time">{now}</span>
        </div>
        <div className="q-card-question">
          {parsed?.paradosso ?? intervention.content}
        </div>
        {parsed?.nucleo && (
          <div className="q-card-nucleus">{parsed.nucleo}</div>
        )}
        {onReaction && (
          <button className="q-card-dismiss" onClick={() => onReaction(intervention.id, 'ignore')}>âœ•</button>
        )}
      </div>
    );
  }

  // â”€â”€ LENTE card
  const philosopherName = philosopher
    ? philosopher.charAt(0).toUpperCase() + philosopher.slice(1)
    : 'Lente';

  return (
    <div className={`q-card ${typeClass}`}>
      <div className="q-card-meta">
        <span className="q-card-trigger">â—ˆ {philosopherName}</span>
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
        <button className="q-card-dismiss" onClick={() => onReaction(intervention.id, 'ignore')}>âœ•</button>
      )}
    </div>
  );
}
