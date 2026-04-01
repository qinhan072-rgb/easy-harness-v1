import type { CanvasReadiness } from '../../types/prototype';

type QuoteSummaryBarProps = {
  readiness: CanvasReadiness;
  connectorCount: number;
  midElementCount: number;
  wireCount: number;
  quoteEstimate: string;
  disabled: boolean;
  onSubmit: () => void;
};

export function QuoteSummaryBar({
  readiness,
  connectorCount,
  midElementCount,
  wireCount,
  quoteEstimate,
  disabled,
  onSubmit,
}: QuoteSummaryBarProps) {
  return (
    <div className="quote-summary-bar">
      <div className="quote-summary-meta">
        <div className="quote-summary-item">
          <span>Status</span>
          <strong>{readiness}</strong>
        </div>
        <div className="quote-summary-item">
          <span>Connectors</span>
          <strong>{connectorCount}</strong>
        </div>
        <div className="quote-summary-item">
          <span>Mid elements</span>
          <strong>{midElementCount}</strong>
        </div>
        <div className="quote-summary-item">
          <span>Wires</span>
          <strong>{wireCount}</strong>
        </div>
        <div className="quote-summary-item">
          <span>Quote estimate</span>
          <strong>{quoteEstimate}</strong>
        </div>
      </div>
      <button type="button" className="button" disabled={disabled} onClick={onSubmit}>
        Submit to Processing
      </button>
    </div>
  );
}
