import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { leadTimePreferenceOptions } from '../data/uploadDrafts';
import { useRequestRecord } from '../hooks/useRequestRecord';
import {
  formatRequestTimestamp,
  getPublicRequestStage,
  publicCanvasReviewStatuses,
  publicOrderDraftStatuses,
  publicRequestStageMeta,
  requestSourceLabels,
} from '../data/requestMeta';
import type { UnifiedRequest } from '../types/request';

const leadTimeLabels = Object.fromEntries(
  leadTimePreferenceOptions.map((option) => [option.value, option.label]),
) as Record<(typeof leadTimePreferenceOptions)[number]['value'], string>;

function buildWhatHappensNow(request: UnifiedRequest) {
  const publicStage = getPublicRequestStage(request.status);

  if (publicStage === 'in-preparation' && request.status === 'needs-info') {
    return 'We are reviewing the intake details and checking which points still need clarification.';
  }

  if (publicStage === 'submitted' && request.status === 'quoted') {
    return 'The prepared draft has been accepted and quotation follow-through is underway.';
  }

  if (publicStage === 'submitted' && request.status === 'order-submitted') {
    return 'The structured order has been received for payment and final handling.';
  }

  if (publicStage === 'submitted' && request.status === 'closed') {
    return 'This request has reached the final submitted stage and is now closed.';
  }

  return publicRequestStageMeta[publicStage].currentDetail;
}

function buildNextStep(request: UnifiedRequest) {
  const publicStage = getPublicRequestStage(request.status);

  if (publicStage === 'in-preparation' && request.status === 'needs-info') {
    return 'If one detail still needs confirmation, the team will contact you.';
  }

  if (publicStage === 'review-required' && request.source === 'canvas') {
    return 'Review Order opens the structured order for final review before submission.';
  }

  if (publicStage === 'review-required') {
    return 'Open Order Draft to review the prepared details and confirm the next action.';
  }

  if (publicStage === 'submitted' && request.status === 'quoted') {
    return 'Quotation follow-through is underway.';
  }

  if (publicStage === 'submitted' && request.status === 'closed') {
    return 'The request has been closed. Keep the request ID for reference.';
  }

  return publicRequestStageMeta[publicStage].nextStep;
}

export function ProcessingStatusPage() {
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
            <p>Submit a request through AI Agent, Configurator Canvas, or Upload Intake.</p>
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
  const reviewPath =
    publicStage === 'review-required'
      ? request.source === 'canvas'
        ? publicCanvasReviewStatuses.has(request.status)
          ? `/review-order/${request.id}`
          : null
        : publicOrderDraftStatuses.has(request.status)
          ? `/order-confirmation/${request.id}`
          : null
      : null;
  const reviewLabel =
    request.source === 'canvas' ? 'Review Order' : 'Open Order Draft';

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
          <span>{requestSourceLabels[request.source]}</span>
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
            <strong>{requestSourceLabels[request.source]}</strong>
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

      {reviewPath ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>Action Required</h3>
            <p>Please review the prepared order details before the request moves forward.</p>
          </div>
          <div className="action-row">
            <Link to={reviewPath} className="button">
              {reviewLabel}
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
