import { midElementCatalog } from '../../data/canvasCatalog';
import type { MidElementBlock } from '../../types/prototype';

type MidElementBlockCardProps = {
  midElement: MidElementBlock;
  isSelected?: boolean;
  onSelect?: () => void;
  onPinClick?: (pin: string) => void;
  registerPinRef?: (pin: string, element: HTMLButtonElement | null) => void;
  activePins?: string[];
  occupiedPins?: string[];
};

export function MidElementBlockCard({
  midElement,
  isSelected = false,
  onSelect,
  onPinClick,
  registerPinRef,
  activePins = [],
  occupiedPins = [],
}: MidElementBlockCardProps) {
  return (
    <article
      className={`canvas-block canvas-block--mid${isSelected ? ' is-selected' : ''}`}
      onClick={onSelect}
    >
      <div className="canvas-block__header">
        <strong>{midElement.label}</strong>
        <span
          className={
            midElement.configurationState === 'configured'
              ? 'status-chip status-chip--success'
              : 'status-chip'
          }
        >
          {midElement.configurationState}
        </span>
      </div>
      <span className="canvas-block__meta">
        {midElementCatalog[midElement.type].label} | column {midElement.column}
      </span>
      <p>
        {midElementCatalog[midElement.type].label} • col {midElement.column}
      </p>
      <span className="muted-copy">{midElement.detail}</span>
      <div className="pin-grid">
        {midElement.ports.map((port) => (
          <button
            key={port}
            type="button"
            ref={(element) => registerPinRef?.(port, element)}
            className={`pin-button${activePins.includes(port) ? ' is-active' : ''}`}
            disabled={occupiedPins.includes(port)}
            onClick={(event) => {
              event.stopPropagation();
              onPinClick?.(port);
            }}
          >
            {port}
          </button>
        ))}
      </div>
      {midElement.missingFields.length > 0 ? (
        <div className="block-alert">
          {midElement.missingFields.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
