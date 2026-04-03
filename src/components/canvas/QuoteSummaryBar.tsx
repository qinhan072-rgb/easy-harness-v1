import type { CanvasReadiness } from '../../types/prototype';

type QuoteSummaryBarProps = {
  readiness: CanvasReadiness;
  connectorCount: number;
  midElementCount: number;
  wireCount: number;
  quoteEstimate: string;
  disabled: boolean;
  submitLabel?: string;
  secondaryActionLabel?: string;
  tertiaryActionLabel?: string;
  onSubmit: () => void;
  onSecondaryAction?: () => void;
  onTertiaryAction?: () => void;
};

export function QuoteSummaryBar({
  readiness,
  connectorCount,
  midElementCount,
  wireCount,
  quoteEstimate,
  disabled,
  submitLabel = 'Submit Request',
  secondaryActionLabel,
  tertiaryActionLabel,
  onSubmit,
  onSecondaryAction,
  onTertiaryAction,
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
          <span>Quote range</span>
          <strong>{quoteEstimate}</strong>
        </div>
      </div>
      <div className="quote-summary-actions">
        {secondaryActionLabel && onSecondaryAction ? (
          <button
            type="button"
            className="button button-secondary"
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </button>
        ) : null}
        {tertiaryActionLabel && onTertiaryAction ? (
          <button
            type="button"
            className="button button-ghost"
            onClick={onTertiaryAction}
          >
            {tertiaryActionLabel}
          </button>
        ) : null}
        <button type="button" className="button" disabled={disabled} onClick={onSubmit}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
