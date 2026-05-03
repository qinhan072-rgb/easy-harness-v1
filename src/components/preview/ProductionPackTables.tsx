import type { HarnessPreviewModel } from '../../utils/harnessPreviewModel';

type ProductionPackTablesProps = {
  model: HarnessPreviewModel;
};

export function ProductionPackTables({ model }: ProductionPackTablesProps) {
  return (
    <div className="production-pack">
      <section className="production-pack__section">
        <div className="production-pack__section-head">
          <h4>Connector Table</h4>
          <p>Endpoints prepared for quotation and connector confirmation.</p>
        </div>
        <div className="production-pack__table">
          <div className="production-pack__table-head">
            <span>Role</span>
            <span>Connector</span>
            <span>Family</span>
            <span>Detail</span>
          </div>
          {model.connectorTable.map((row) => (
            <div key={row.id} className="production-pack__table-row">
              <span>{row.role}</span>
              <strong>{row.label}</strong>
              <span>{row.family}</span>
              <span>
                {row.detail}
                {row.estimated ? ' - Estimated' : ''}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="production-pack__section">
        <div className="production-pack__section-head">
          <h4>Wire Table</h4>
          <p>Main trunk and branch runs prepared from the current request.</p>
        </div>
        <div className="production-pack__table">
          <div className="production-pack__table-head">
            <span>Wire</span>
            <span>Route</span>
            <span>Length</span>
            <span>Spec</span>
          </div>
          {model.wireTable.map((row) => (
            <div key={row.id} className="production-pack__table-row">
              <strong>{row.label}</strong>
              <span>{row.routeLabel}</span>
              <span>{row.lengthLabel}</span>
              <span>
                {row.specLabel}
                {row.estimated ? ' - Estimated' : ''}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="production-pack__section">
        <div className="production-pack__section-head">
          <h4>Elements / Protection</h4>
          <p>Inline elements, coverings, and routing supports.</p>
        </div>
        <div className="production-pack__table">
          <div className="production-pack__table-head">
            <span>Element</span>
            <span>Type</span>
            <span>Location</span>
            <span>Detail</span>
          </div>
          {model.elementTable.map((row) => (
            <div key={row.id} className="production-pack__table-row">
              <strong>{row.label}</strong>
              <span>{row.typeLabel}</span>
              <span>{row.location}</span>
              <span>
                {row.detail}
                {row.estimated ? ' - Estimated' : ''}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="production-pack__section production-pack__section--open-items">
        <div className="production-pack__section-head">
          <h4>Engineering Open Items</h4>
          <p>Current assumptions and confirmations still needed.</p>
        </div>
        <div className="production-pack__open-items">
          <div className="production-pack__open-card">
            <span className="eyebrow">Assumptions</span>
            <ul className="simple-list">
              {model.assumptions.length === 0 ? (
                <li>No assumptions listed.</li>
              ) : (
                model.assumptions.map((item) => <li key={item}>{item}</li>)
              )}
            </ul>
          </div>
          <div className="production-pack__open-card">
            <span className="eyebrow">Missing Items</span>
            <ul className="simple-list">
              {model.missingInfo.length === 0 ? (
                <li>No confirmations are currently open.</li>
              ) : (
                model.missingInfo.map((item) => <li key={item}>{item}</li>)
              )}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
