/**
 * <LensToolbar /> — floating popup for philosophical lens selection.
 *
 * Appears when text is selected in the editor textarea.
 * Triggers a lente intervention via the provided callback.
 *
 * PoC-identical layout: 8 philosophers, monochrome accent (#c084fc).
 */

import './LensToolbar.css';

export const LENS_PHILOSOPHERS = [
  { key: 'sartre',      name: 'Sartre',      desc: 'libertà / condanna' },
  { key: 'camus',       name: 'Camus',       desc: 'assurdo / rivolta' },
  { key: 'heidegger',   name: 'Heidegger',   desc: 'essere / gettarsi' },
  { key: 'levinas',     name: 'Levinas',     desc: 'altro / responsabilità' },
  { key: 'aristotele',  name: 'Aristotele',  desc: 'sostanza / accidente' },
  { key: 'platone',     name: 'Platone',     desc: 'reale / simulacro' },
  { key: 'whitehead',   name: 'Whitehead',   desc: 'processo / evento' },
  { key: 'baudrillard', name: 'Baudrillard', desc: 'iperreale / modello' },
] as const;

interface LensToolbarProps {
  visible: boolean;
  top: number;
  left: number;
  onSelect: (philosopherKey: string) => void;
  onClose: () => void;
}

export default function LensToolbar({
  visible,
  top,
  left,
  onSelect,
  onClose,
}: LensToolbarProps) {
  if (!visible) return null;

  return (
    <div
      className="lens-toolbar"
      style={{ top, left }}
      onMouseDown={(e) => e.preventDefault()} // prevent textarea blur
    >
      <div className="lens-toolbar-label">◈ lente filosofica</div>
      {LENS_PHILOSOPHERS.map(({ key, name, desc }) => (
        <div
          key={key}
          className="lens-option"
          onClick={() => {
            onSelect(key);
            onClose();
          }}
        >
          <span className="lens-option-name">{name}</span>
          <span className="lens-option-desc">{desc}</span>
        </div>
      ))}
    </div>
  );
}
