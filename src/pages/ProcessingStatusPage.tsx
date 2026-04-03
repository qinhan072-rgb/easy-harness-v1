import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StatusTimeline } from '../components/StatusTimeline';
import { useRequestRecord } from '../hooks/useRequestRecord';
import {
  buildStatusTimeline,
  formatRequestTimestamp,
  requestSourceLabels,
  requestStatusMeta,
} from '../data/requestMeta';

export function ProcessingStatusPage() {
  const params = useParams<{ requestId: string }>();
  const { request, requestId, isLoading, error } = useRequestRecord(
    params.requestId,
  );

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Request Status"
          description="Loading your request."
          badge="Loading"
        />
        <section className="panel">
          <div className="empty-state">
            <strong>Loading request...</strong>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Request Status"
          description="We could not load this request."
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
          title="Request Status"
          description="Available after a request has been submitted."
          badge="Waiting"
        />
        <section className="panel">
          <div className="empty-state">
            <strong>No request is active yet.</strong>
            <p>Submit a request through AI Agent, Configurator Canvas, or Upload Intake.</p>
            <Link to="/" className="button">
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const statusMeta = requestStatusMeta[request.status];
  const sourceLabel = requestSourceLabels[request.source];
  const pageDescription =
    request.status === 'order-submitted'
      ? 'Follow the next order step after structured order submission.'
      : 'Track intake progress as the request moves toward draft preparation and quotation.';
  const nextStepMessage =
    request.status === 'draft-ready' || request.status === 'awaiting-confirmation'
      ? 'The draft is ready for customer review.'
      : request.status === 'order-submitted'
        ? 'Order received. Payment and final handling are next. The team may contact you if one final detail still needs confirmation.'
      : request.status === 'quoted'
        ? 'Draft confirmation has been received and quotation handling is underway.'
        : request.status === 'needs-info'
          ? 'Additional details are required before draft preparation can continue.'
          : 'The request is being organized for draft preparation.';
  const reviewPath =
    request.source === 'canvas'
      ? request.status === 'draft-ready' || request.status === 'order-submitted'
        ? `/review-order/${request.id}`
        : null
      : request.status === 'draft-ready' || request.status === 'awaiting-confirmation'
        ? `/order-confirmation/${request.id}`
        : null;
  const reviewLabel =
    request.source === 'canvas'
      ? request.status === 'order-submitted'
        ? 'View Order Summary'
        : 'Review Order'
      : 'Review Order Draft';

  return (
    <div className="page-stack">
      <PageHeader
        title="Request Status"
        description={pageDescription}
        badge={statusMeta.label}
      />

      <section className="panel processing-hero">
        <div>
          <span className="eyebrow">Request record</span>
          <h3>{request.projectName}</h3>
          <p>{request.requestSummary}</p>
        </div>
        <div className="processing-hero__meta">
          <strong>{statusMeta.label}</strong>
          <span>{sourceLabel}</span>
          <span>{request.id}</span>
        </div>
      </section>

      <div className="info-banner info-banner--subtle">
        {request.status === 'order-submitted'
          ? 'Order submission has been recorded. Payment and final handling are next.'
          : 'Status updates appear here as the request moves through intake, draft preparation, and confirmation.'}
      </div>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Status Timeline</h3>
            <p>Follow the current stage of your request.</p>
          </div>
          <StatusTimeline items={buildStatusTimeline(request.status)} />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Request Snapshot</h3>
            <p>Key request details.</p>
          </div>
          <div className="summary-grid">
            <div className="summary-card">
              <span>Quantity</span>
              <strong>{request.quantity}</strong>
            </div>
            <div className="summary-card">
              <span>Lead time</span>
              <strong>{request.leadTimePreference}</strong>
            </div>
            <div className="summary-card">
              <span>Attachments</span>
              <strong>{request.attachments.length}</strong>
            </div>
            <div className="summary-card">
              <span>Created</span>
              <strong>{formatRequestTimestamp(request.createdAt)}</strong>
            </div>
          </div>
          <ul className="simple-list">
            <li>Known connectors: {request.knownConnectors.length}</li>
            <li>Known elements: {request.knownElements.length}</li>
            <li>Known wires: {request.knownWires.length}</li>
            <li>Missing info items: {request.missingInfo.length}</li>
          </ul>
        </article>
      </section>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Notes And Intent</h3>
            <p>Application details saved with the intake record.</p>
          </div>
          <div className="draft-copy-group">
            <div>
              <span className="eyebrow">Intended use</span>
              <p>{request.intendedUse || 'Not specified yet.'}</p>
            </div>
            <div>
              <span className="eyebrow">Environment notes</span>
              <p>{request.environmentNotes || 'No environment notes yet.'}</p>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Next Step</h3>
            <p>{nextStepMessage}</p>
          </div>
          <div className="action-row">
            {reviewPath ? (
              <Link to={reviewPath} className="button">
                {reviewLabel}
              </Link>
            ) : null}
            <Link to="/" className="button button-secondary">
              Back to Home
            </Link>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Attachments</h3>
          <p>Files included with this request.</p>
        </div>
        {request.attachments.length === 0 ? (
          <div className="empty-state">
            <strong>No attachments uploaded yet.</strong>
            <p>This request can still move forward with review and follow-up.</p>
          </div>
        ) : (
          <div className="attachment-list">
            {request.attachments.map((attachment) => (
              <a
                key={attachment.id}
                className="attachment-row request-attachment-link"
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
              >
                <span>{attachment.originalName}</span>
                <span>{Math.round(attachment.sizeBytes / 1024)} KB</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
