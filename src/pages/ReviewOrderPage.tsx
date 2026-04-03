import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useRequestSession } from '../context/RequestSessionContext';
import { requestSourceLabels, requestStatusMeta } from '../data/requestMeta';
import { useRequestRecord } from '../hooks/useRequestRecord';
import { updateRequest } from '../utils/requestApi';

const reviewOrderStatuses = new Set(['draft-ready', 'order-submitted']);

function formatStructuredItem(item: string) {
  return item.replace(/[^\x20-\x7E]+/g, ' - ');
}

export function ReviewOrderPage() {
  const navigate = useNavigate();
  const params = useParams<{ requestId: string }>();
  const { refreshActiveRequest } = useRequestSession();
  const { request, requestId, isLoading, error, reload } = useRequestRecord(
    params.requestId,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleStatusUpdate(nextStatus: 'order-submitted' | 'draft-in-progress') {
    if (!request) {
      return;
    }

    setIsSaving(true);
    setActionError(null);

    try {
      await updateRequest(request.id, { status: nextStatus });
      await reload();
      await refreshActiveRequest();
      navigate(`/processing/${request.id}`);
    } catch (saveError) {
      setActionError(
        saveError instanceof Error
          ? saveError.message
          : 'We could not update this order.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Review Order"
          description="Loading the configured order."
          badge="Loading"
        />
        <section className="panel">
          <div className="empty-state">
            <strong>Loading order...</strong>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Review Order"
          description="We could not load this configured order."
          badge="Unavailable"
        />
        <section className="panel">
          <div className="info-banner info-banner--error">{error}</div>
          <div className="action-row">
            <Link to="/" className="button">
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!request || !requestId) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Review Order"
          description="Available after a structured configurator request has been saved."
          badge="Waiting"
        />
        <section className="panel">
          <div className="empty-state">
            <strong>No configured order is available yet.</strong>
            <p>Prepare a complete structured harness in the Configurator to continue.</p>
            <Link to="/configurator" className="button">
              Open Configurator
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (request.source !== 'canvas') {
    return (
      <div className="page-stack">
        <PageHeader
          title="Review Order"
          description="This direct order path is reserved for structured configurator requests."
          badge={requestSourceLabels[request.source]}
        />
        <section className="panel">
          <div className="empty-state">
            <strong>{request.projectName}</strong>
            <p>Open the request status page for the active intake record.</p>
            <div className="action-row">
              <Link to={`/processing/${request.id}`} className="button">
                View Request Status
              </Link>
              <Link to="/" className="button button-secondary">
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!reviewOrderStatuses.has(request.status)) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Review Order"
          description="This order is moving through the review path."
          badge={requestStatusMeta[request.status].label}
        />
        <section className="panel">
          <div className="empty-state">
            <strong>{request.projectName}</strong>
            <p>Open request status to follow the next step for this configurator record.</p>
            <div className="action-row">
              <Link to={`/processing/${request.id}`} className="button">
                View Request Status
              </Link>
              <Link to="/configurator" className="button button-secondary">
                Back to Configurator
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const statusMeta = requestStatusMeta[request.status];
  const structuredSummary = request.draftSummary || request.requestSummary;
  const leadTimeNote =
    request.leadTimeNote || 'Lead time will be confirmed during final handling.';
  const quotePlaceholder =
    request.quotePlaceholder || 'Quotation placeholder will be finalized during follow-through.';
  const isOrderSubmitted = request.status === 'order-submitted';

  return (
    <div className="page-stack">
      <PageHeader
        title="Review Order"
        description={
          isOrderSubmitted
            ? 'This structured order has been received and is awaiting payment or final handling.'
            : 'Review the configured harness before placing the order.'
        }
        badge={statusMeta.label}
      />

      <div className="info-banner info-banner--subtle">
        {isOrderSubmitted
          ? 'This configuration has been accepted inside the current structured boundary.'
          : 'This configuration is ready for order placement inside the current structured boundary.'}
      </div>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Order summary</h3>
            <p>Review the structured order content before the next step.</p>
          </div>
          <div className="summary-grid">
            <div className="summary-card">
              <span>Project</span>
              <strong>{request.projectName}</strong>
            </div>
            <div className="summary-card">
              <span>Request ID</span>
              <strong>{request.id}</strong>
            </div>
            <div className="summary-card">
              <span>Source</span>
              <strong>Configurator</strong>
            </div>
            <div className="summary-card">
              <span>Quantity</span>
              <strong>{request.quantity}</strong>
            </div>
            <div className="summary-card">
              <span>Quote placeholder</span>
              <strong>{quotePlaceholder}</strong>
            </div>
            <div className="summary-card">
              <span>Lead time note</span>
              <strong>{leadTimeNote}</strong>
            </div>
          </div>
          <div className="draft-copy-group">
            <div>
              <span className="eyebrow">Structured summary</span>
              <p>{structuredSummary}</p>
            </div>
            <div>
              <span className="eyebrow">Intended use</span>
              <p>{request.intendedUse || 'No intended use has been recorded.'}</p>
            </div>
            <div>
              <span className="eyebrow">Environment notes</span>
              <p>{request.environmentNotes || 'No environment notes have been recorded.'}</p>
            </div>
            {request.manufacturableNotes ? (
              <div>
                <span className="eyebrow">Manufacturable notes</span>
                <p>{request.manufacturableNotes}</p>
              </div>
            ) : null}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Structured content</h3>
            <p>Connector, element, and wire details included in this configured order.</p>
          </div>
          <div className="panel-grid panel-grid--2">
            <div className="sub-panel">
              <span className="eyebrow">Connectors</span>
              <ul className="simple-list">
                {request.knownConnectors.length === 0 ? (
                  <li>No connector details recorded.</li>
                ) : (
                  request.knownConnectors.map((item) => (
                    <li key={item}>{formatStructuredItem(item)}</li>
                  ))
                )}
              </ul>
            </div>
            <div className="sub-panel">
              <span className="eyebrow">Elements</span>
              <ul className="simple-list">
                {request.knownElements.length === 0 ? (
                  <li>No element details recorded.</li>
                ) : (
                  request.knownElements.map((item) => (
                    <li key={item}>{formatStructuredItem(item)}</li>
                  ))
                )}
              </ul>
            </div>
            <div className="sub-panel">
              <span className="eyebrow">Wires</span>
              <ul className="simple-list">
                {request.knownWires.length === 0 ? (
                  <li>No wire details recorded.</li>
                ) : (
                  request.knownWires.map((item) => (
                    <li key={item}>{formatStructuredItem(item)}</li>
                  ))
                )}
              </ul>
            </div>
            <div className="sub-panel">
              <span className="eyebrow">Boundary status</span>
              <p>Ready for order placement inside the current structured boundary.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Assumptions</h3>
            <p>Current assumptions recorded with this structured order.</p>
          </div>
          <ul className="simple-list">
            {request.assumptions.length === 0 ? (
              <li>No assumptions recorded.</li>
            ) : (
              request.assumptions.map((item) => <li key={item}>{item}</li>)
            )}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Missing items</h3>
            <p>Open points that may still need confirmation.</p>
          </div>
          <ul className="simple-list">
            {request.missingInfo.length === 0 ? (
              <li>No missing items are currently recorded.</li>
            ) : (
              request.missingInfo.map((item) => <li key={item}>{item}</li>)
            )}
          </ul>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Next action</h3>
          <p>
            {isOrderSubmitted
              ? 'Order received. Payment and final handling are next.'
              : 'Place the order now, or send it for review if team confirmation is still needed.'}
          </p>
        </div>
        {actionError ? (
          <div className="info-banner info-banner--error">{actionError}</div>
        ) : null}
        <div className="action-row">
          {isOrderSubmitted ? (
            <>
              <Link to={`/processing/${request.id}`} className="button">
                View Request Status
              </Link>
              <Link to="/configurator" className="button button-ghost">
                Back to Configurator
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                className="button"
                disabled={isSaving}
                onClick={() => void handleStatusUpdate('order-submitted')}
              >
                {isSaving ? 'Saving...' : 'Place Order'}
              </button>
              <button
                type="button"
                className="button button-secondary"
                disabled={isSaving}
                onClick={() => void handleStatusUpdate('draft-in-progress')}
              >
                Request Review Instead
              </button>
              <Link to="/configurator" className="button button-ghost">
                Back to Configurator
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
