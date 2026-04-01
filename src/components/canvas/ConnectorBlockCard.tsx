import type { ConnectorBlock } from '../../types/prototype';

export function ConnectorBlockCard({ connector }: { connector: ConnectorBlock }) {
  return (
    <article className="canvas-block">
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
      <div className="tag-list">
        {connector.options.map((option) => (
          <span key={option} className="tag">
            {option}
          </span>
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
