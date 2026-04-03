import type { ConnectorBlock } from '../../types/prototype';

type ConnectorBlockCardProps = {
  connector: ConnectorBlock;
  isSelected?: boolean;
  onSelect?: () => void;
  onPinClick?: (pin: string) => void;
  registerPinRef?: (pin: string, element: HTMLButtonElement | null) => void;
  activePins?: string[];
  occupiedPins?: string[];
};

export function ConnectorBlockCard({
  connector,
  isSelected = false,
  onSelect,
  onPinClick,
  registerPinRef,
  activePins = [],
  occupiedPins = [],
}: ConnectorBlockCardProps) {
  const pins = Array.from({ length: connector.pins }, (_, index) => `P${index + 1}`);

  return (
    <article
      className={`canvas-block${isSelected ? ' is-selected' : ''}`}
      onClick={onSelect}
    >
      <div className="canvas-block__header">
        <strong>{connector.label}</strong>
        <span
          className={
            connector.configurationState === 'configured'
              ? 'status-chip status-chip--success'
              : 'status-chip'
          }
        >
          {connector.configurationState}
        </span>
      </div>
      <span className="canvas-block__meta">
        {connector.family} | {connector.zone} zone
      </span>
      <p>
        {connector.family} • {connector.zone} zone
      </p>
      <dl className="detail-list">
        <div>
          <dt>Pins</dt>
          <dd>{connector.pins}</dd>
        </div>
        <div>
          <dt>AWG</dt>
          <dd>{connector.awg}</dd>
        </div>
      </dl>
      {connector.options.length > 0 ? (
        <div className="tag-list">
          {connector.options.map((option) => (
            <span key={option} className="tag">
              {option}
            </span>
          ))}
        </div>
      ) : null}
      <div className="pin-grid">
        {pins.map((pin) => (
          <button
            key={pin}
            type="button"
            ref={(element) => registerPinRef?.(pin, element)}
            className={`pin-button${activePins.includes(pin) ? ' is-active' : ''}`}
            disabled={occupiedPins.includes(pin)}
            onClick={(event) => {
              event.stopPropagation();
              onPinClick?.(pin);
            }}
          >
            {pin}
          </button>
        ))}
      </div>
      {connector.missingFields.length > 0 ? (
        <div className="block-alert">
          {connector.missingFields.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
