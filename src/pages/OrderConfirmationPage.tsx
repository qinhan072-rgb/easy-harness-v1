import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useRequestSession } from '../context/RequestSessionContext';
import {
  draftReadyStatuses,
  publicOrderDraftStatuses,
  requestSourceLabels,
  requestStatusMeta,
} from '../data/requestMeta';
import { useRequestRecord } from '../hooks/useRequestRecord';
import { updateRequest } from '../utils/requestApi';

function normalizeItem(item: string) {
  return item.split('閳?').join(' - ').split('闁?').join(' - ');
}

export function OrderConfirmationPage() {
  const navigate = useNavigate();
  const params = useParams<{ requestId: string }>();
  const { refreshActiveRequest } = useRequestSession();
  const { request, requestId, isLoading, error, reload } = useRequestRecord(
    params.requestId,
  );
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDraftAction(nextStatus: 'quoted' | 'needs-info') {
    if (!request) {
      return;
    }

    setIsSubmittingAction(true);
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
          : 'We could not save your response.',
      );
    } finally {
      setIsSubmittingAction(false);
    }
  }
  const normalizeItem = (item: string) =>
    item.split('鈥?').join(' - ').split('閳?').join(' - ');
  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Order Draft"
          description="Loading the draft record."
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
          title="Order Draft"
          description="We could not load the draft record."
          badge="Unavailable"
        />
        <section className="panel">
          <div className="info-banner info-banner--error">{error}</div>
          <Link to="/" className="button">
            Back to Home
          </Link>
        </section>
      </div>
    );
  }

  if (!request || !requestId) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Order Draft"
          description="Available after a request has been submitted."
          badge="Waiting"
        />
        <section className="panel">
          <div className="empty-state">
            <strong>No draft is available yet.</strong>
            <p>Submit a request first, then return when draft preparation is ready for review.</p>
            <Link to="/" className="button">
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (request.source === 'canvas') {
    return (
      <Navigate
        to={
          request.status === 'draft-ready' || request.status === 'order-submitted'
            ? `/review-order/${request.id}`
            : `/processing/${request.id}`
        }
        replace
      />
    );
  }

  if (!publicOrderDraftStatuses.has(request.status)) {
    return <Navigate to={`/processing/${request.id}`} replace />;
  }

  const statusMeta = requestStatusMeta[request.status];
  const canRespondToDraft = draftReadyStatuses.has(request.status);

  const draftSummary = request.draftSummary || request.requestSummary;
  const shouldShowManufacturableNotes = Boolean(request.manufacturableNotes);

  return (
    <div className="page-stack">
      <PageHeader
        title="Order Draft"
        description={
          canRespondToDraft
            ? 'Review the prepared draft before confirmation and quotation handling.'
            : 'Prepared draft details are available here for reference.'
        }
        badge={statusMeta.label}
      />

      <div className="info-banner info-banner--subtle">
        {canRespondToDraft
          ? 'Review the prepared draft, assumptions, missing details, and quotation note before responding.'
          : 'Prepared draft details remain available here while the request moves through the next stage.'}
      </div>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Draft Summary</h3>
            <p>Prepared from the intake record for customer review.</p>
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
              <span>Status</span>
              <strong>{statusMeta.label}</strong>
            </div>
            <div className="summary-card">
              <span>Quantity</span>
              <strong>{request.quantity}</strong>
            </div>
            <div className="summary-card">
              <span>Lead time</span>
              <strong>{request.leadTimePreference}</strong>
            </div>
            <div className="summary-card">
              <span>Quotation</span>
              <strong>{request.quotePlaceholder || 'Pending'}</strong>
            </div>
          </div>
          <div className="draft-copy-group">
            <div>
              <span className="eyebrow">Draft summary</span>
              <p>{draftSummary}</p>
            </div>
            <div>
              <span className="eyebrow">Lead time note</span>
              <p>{request.leadTimeNote || 'Lead time notes have not been provided yet.'}</p>
            </div>
            <div>
              <span className="eyebrow">Intended use</span>
              <p>{request.intendedUse || 'Intended use has not been provided yet.'}</p>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Draft details</h3>
            <p>Additional information prepared for confirmation.</p>
          </div>
          <div className="draft-copy-group">
            <div>
              <span className="eyebrow">Environment notes</span>
              <p>{request.environmentNotes || 'Environment notes have not been provided yet.'}</p>
            </div>
            {shouldShowManufacturableNotes ? (
              <div>
                <span className="eyebrow">Manufacturing notes</span>
                <p>{request.manufacturableNotes}</p>
              </div>
            ) : null}
            {request.source === 'upload' ? (
              <div>
                <span className="eyebrow">Reference files</span>
                <p>
                  {request.attachments.length > 0
                    ? `${request.attachments.length} file(s) attached to the request.`
                    : 'No reference files were attached to the request.'}
                </p>
              </div>
            ) : null}
            {request.source === 'ai' ? (
              <div>
                <span className="eyebrow">Original AI request</span>
                <p>{request.requestSummary}</p>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Assumptions</h3>
            <p>Current assumptions affecting draft preparation.</p>
          </div>
          <ul className="simple-list">
            {request.assumptions.length === 0 ? (
              <li>No assumptions are listed.</li>
            ) : (
              request.assumptions.map((item) => <li key={item}>{item}</li>)
            )}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Missing Details</h3>
            <p>Items that still require confirmation.</p>
          </div>
          <ul className="simple-list">
            {request.missingInfo.length === 0 ? (
              <li>No missing details are listed.</li>
            ) : (
              request.missingInfo.map((item) => <li key={item}>{item}</li>)
            )}
          </ul>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>{canRespondToDraft ? 'Customer Response' : 'Next Step'}</h3>
          <p>
            {canRespondToDraft
              ? 'Confirm the draft to move forward, or request changes if details need adjustment.'
              : 'Return to request status for the latest handling update.'}
          </p>
        </div>
        {actionError ? (
          <div className="info-banner info-banner--error">{actionError}</div>
        ) : null}
        <div className="action-row">
          {canRespondToDraft ? (
            <>
              <button
                type="button"
                className="button"
                disabled={isSubmittingAction}
                onClick={() => void handleDraftAction('quoted')}
              >
                {isSubmittingAction ? 'Saving...' : 'Confirm Draft'}
              </button>
              <button
                type="button"
                className="button button-secondary"
                disabled={isSubmittingAction}
                onClick={() => void handleDraftAction('needs-info')}
              >
                Request Changes
              </button>
            </>
          ) : null}
          <Link to={`/processing/${request.id}`} className="button button-ghost">
            Back to Request Status
          </Link>
        </div>
      </section>
    </div>
  );
}
