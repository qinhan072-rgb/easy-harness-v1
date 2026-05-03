import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { leadTimePreferenceOptions } from '../data/uploadDrafts';
import { useRequestRecord } from '../hooks/useRequestRecord';
import {
  formatRequestTimestamp,
  getPublicRequestStage,
  publicPreviewStatuses,
  publicRequestSourceLabels,
  publicRequestStageMeta,
} from '../data/requestMeta';
import type { UnifiedRequest } from '../types/request';

const leadTimeLabels = Object.fromEntries(
  leadTimePreferenceOptions.map((option) => [option.value, option.label]),
) as Record<(typeof leadTimePreferenceOptions)[number]['value'], string>;

function buildWhatHappensNow(request: UnifiedRequest) {
  const publicStage = getPublicRequestStage(request.status);

  if (publicStage === 'in-preparation' && request.status === 'needs-info') {
    return 'The intake details are being reviewed and any missing points are being checked.';
  }

  if (publicStage === 'submitted' && request.status === 'quoted') {
    return 'The prepared harness has already moved into quotation follow-through.';
  }

  if (publicStage === 'submitted' && request.status === 'order-submitted') {
    return 'The generated order has been accepted and moved into final handling.';
  }

  if (publicStage === 'submitted' && request.status === 'closed') {
    return 'This request has completed the current handling cycle and is now closed.';
  }

  return publicRequestStageMeta[publicStage].currentDetail;
}

function buildNextStep(request: UnifiedRequest) {
  const publicStage = getPublicRequestStage(request.status);

  if (publicStage === 'review-required') {
    return 'Open the generated preview and confirm the next action when you are ready.';
  }

  if (publicStage === 'submitted' && request.status === 'quoted') {
    return 'Quotation follow-through is underway.';
  }

  if (publicStage === 'submitted' && request.status === 'closed') {
    return 'Keep the request ID for reference if you need to return to this record.';
  }

  return publicRequestStageMeta[publicStage].nextStep;
}

export function RequestTrackingPage() {
  const params = useParams<{ requestId: string }>();
  const { request, requestId, isLoading, error } = useRequestRecord(
    params.requestId,
  );

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Track Request"
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
          title="Track Request"
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
          title="Track Request"
          description="Available after a request has been submitted."
          badge="Waiting"
        />
        <section className="panel">
          <div className="empty-state">
            <strong>No request is active yet.</strong>
            <p>Submit a request through AI Agent or Configurator.</p>
            <Link to="/" className="button">
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const publicStage = getPublicRequestStage(request.status);
  const stageMeta = publicRequestStageMeta[publicStage];
  const previewPath =
    publicStage === 'review-required' && publicPreviewStatuses.has(request.status)
      ? `/generated/${request.id}`
      : null;

  return (
    <div className="page-stack">
      <PageHeader
        title="Track Request"
        description="Check the current stage of your request and whether any action is needed."
        badge={stageMeta.label}
      />

      <section className="panel processing-hero">
        <div>
          <span className="eyebrow">Current stage</span>
          <h3>{stageMeta.label}</h3>
          <p>{stageMeta.currentState}</p>
        </div>
        <div className="processing-hero__meta">
          <strong>{stageMeta.label}</strong>
          <span>{publicRequestSourceLabels[request.source]}</span>
          <span>Updated {formatRequestTimestamp(request.updatedAt)}</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Current Request</h3>
          <p>Key request details.</p>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <span>Request ID</span>
            <strong>{request.id}</strong>
          </div>
          <div className="summary-card">
            <span>Project</span>
            <strong>{request.projectName}</strong>
          </div>
          <div className="summary-card">
            <span>Source</span>
            <strong>{publicRequestSourceLabels[request.source]}</strong>
          </div>
          <div className="summary-card">
            <span>Quantity</span>
            <strong>{request.quantity}</strong>
          </div>
          <div className="summary-card">
            <span>Requested lead time</span>
            <strong>{leadTimeLabels[request.leadTimePreference]}</strong>
          </div>
          <div className="summary-card">
            <span>Attachments</span>
            <strong>{request.attachments.length}</strong>
          </div>
        </div>
      </section>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>What Happens Now</h3>
            <p>{buildWhatHappensNow(request)}</p>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Next Step</h3>
            <p>{buildNextStep(request)}</p>
          </div>
        </article>
      </section>

      {previewPath ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>Action Required</h3>
            <p>Open the generated preview to review the prepared harness.</p>
          </div>
          <div className="action-row">
            <Link to={previewPath} className="button">
              Open Harness Preview
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
