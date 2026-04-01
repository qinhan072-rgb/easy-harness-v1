import { midElementCatalog } from '../../data/canvasCatalog';
import type { MidElementBlock } from '../../types/prototype';

export function MidElementBlockCard({
  midElement,
}: {
  midElement: MidElementBlock;
}) {
  return (
    <article className="canvas-block canvas-block--mid">
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
      <p>
        {midElementCatalog[midElement.type].label} • col {midElement.column}
      </p>
      <span className="muted-copy">{midElement.detail}</span>
      <div className="tag-list">
        {midElement.ports.map((port) => (
          <span key={port} className="tag">
            {port}
          </span>
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
