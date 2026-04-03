import { midElementCatalog } from '../../data/canvasCatalog';
import type { MidElementBlock } from '../../types/prototype';

type MidElementObjectCardProps = {
  midElement: MidElementBlock;
  isSelected?: boolean;
  onSelect?: () => void;
  onPinClick?: (pin: string) => void;
  registerPinRef?: (pin: string, element: HTMLButtonElement | null) => void;
  activePins?: string[];
  occupiedPins?: string[];
};

export function MidElementObjectCard({
  midElement,
  isSelected = false,
  onSelect,
  onPinClick,
  registerPinRef,
  activePins = [],
  occupiedPins = [],
}: MidElementObjectCardProps) {
  const configured = midElement.configurationState === 'configured';
  const splitIndex = Math.ceil(midElement.ports.length / 2);
  const leftPorts = midElement.ports.slice(0, splitIndex);
  const rightPorts = midElement.ports.slice(splitIndex);

  return (
    <article
      className={`canvas-object canvas-object--mid${isSelected ? ' is-selected' : ''}`}
      onClick={onSelect}
    >
      <div className="canvas-object__body">
        <div className="canvas-object__topline">
          <span className="canvas-object__kind">
            {midElementCatalog[midElement.type].label}
          </span>
          <span
            className={`canvas-object__state${configured ? ' is-configured' : ''}`}
            aria-label={configured ? 'Configured' : 'Needs details'}
          />
        </div>
        <strong className="canvas-object__title">{midElement.label}</strong>
        <div className="canvas-object__meta-row">
          <span className="canvas-object__caption">Column {midElement.column}</span>
          <span className="canvas-object__footprint">{midElement.ports.length} ports</span>
        </div>
      </div>

      <div className="canvas-object__edge-rail canvas-object__edge-rail--left">
        {leftPorts.map((port) => (
          <button
            key={port}
            type="button"
            ref={(element) => registerPinRef?.(port, element)}
            className={`pin-button pin-button--mini${
              activePins.includes(port) ? ' is-active' : ''
            }`}
            disabled={occupiedPins.includes(port)}
            title={
              occupiedPins.includes(port)
                ? `Occupied pin: ${port} is already used in another wire.`
                : `Connect from ${midElement.label} ${port}`
            }
            aria-label={
              occupiedPins.includes(port)
                ? `Occupied pin ${port}`
                : `Connect from ${midElement.label} ${port}`
            }
            onClick={(event) => {
              event.stopPropagation();
              onPinClick?.(port);
            }}
          >
            {port.replace('Port ', '')}
          </button>
        ))}
      </div>

      <div className="canvas-object__edge-rail canvas-object__edge-rail--right">
        {rightPorts.map((port) => (
          <button
            key={port}
            type="button"
            ref={(element) => registerPinRef?.(port, element)}
            className={`pin-button pin-button--mini${
              activePins.includes(port) ? ' is-active' : ''
            }`}
            disabled={occupiedPins.includes(port)}
            title={
              occupiedPins.includes(port)
                ? `Occupied pin: ${port} is already used in another wire.`
                : `Connect from ${midElement.label} ${port}`
            }
            aria-label={
              occupiedPins.includes(port)
                ? `Occupied pin ${port}`
                : `Connect from ${midElement.label} ${port}`
            }
            onClick={(event) => {
              event.stopPropagation();
              onPinClick?.(port);
            }}
          >
            {port.replace('Port ', '')}
          </button>
        ))}
      </div>
    </article>
  );
}
