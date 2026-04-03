import type { ConnectorBlock } from '../../types/prototype';

type ConnectorObjectCardProps = {
  connector: ConnectorBlock;
  isSelected?: boolean;
  onSelect?: () => void;
  onPinClick?: (pin: string) => void;
  registerPinRef?: (pin: string, element: HTMLButtonElement | null) => void;
  activePins?: string[];
  occupiedPins?: string[];
};

export function ConnectorObjectCard({
  connector,
  isSelected = false,
  onSelect,
  onPinClick,
  registerPinRef,
  activePins = [],
  occupiedPins = [],
}: ConnectorObjectCardProps) {
  const pins = Array.from({ length: connector.pins }, (_, index) => `P${index + 1}`);
  const configured = connector.configurationState === 'configured';
  const edgeRailClass =
    connector.zone === 'left'
      ? 'canvas-object__edge-rail canvas-object__edge-rail--right'
      : 'canvas-object__edge-rail canvas-object__edge-rail--left';

  return (
    <article
      className={`canvas-object canvas-object--connector canvas-object--${connector.zone}${
        isSelected ? ' is-selected' : ''
      }`}
      onClick={onSelect}
    >
      <div className="canvas-object__body">
        <div className="canvas-object__topline">
          <span className="canvas-object__kind">{connector.zone} connector</span>
          <span
            className={`canvas-object__state${configured ? ' is-configured' : ''}`}
            aria-label={configured ? 'Configured' : 'Needs details'}
          />
        </div>
        <strong className="canvas-object__title">{connector.label}</strong>
        <div className="canvas-object__meta-row">
          <span className="canvas-object__caption">{connector.family}</span>
          <span className="canvas-object__footprint">{connector.pins} pins</span>
        </div>
      </div>

      <div className={edgeRailClass}>
        {pins.map((pin) => (
          <button
            key={pin}
            type="button"
            ref={(element) => registerPinRef?.(pin, element)}
            className={`pin-button pin-button--mini${
              activePins.includes(pin) ? ' is-active' : ''
            }`}
            disabled={occupiedPins.includes(pin)}
            title={
              occupiedPins.includes(pin)
                ? `Occupied pin: ${pin} is already used in another wire.`
                : `Connect from ${connector.label} ${pin}`
            }
            aria-label={
              occupiedPins.includes(pin)
                ? `Occupied pin ${pin}`
                : `Connect from ${connector.label} ${pin}`
            }
            onClick={(event) => {
              event.stopPropagation();
              onPinClick?.(pin);
            }}
          >
            {pin.replace('P', '')}
          </button>
        ))}
      </div>
    </article>
  );
}
