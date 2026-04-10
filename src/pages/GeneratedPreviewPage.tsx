import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { HarnessPreviewGraphic } from '../components/preview/HarnessPreviewGraphic';
import { ProductionLayoutPreview } from '../components/preview/ProductionLayoutPreview';
import { ProductionPackTables } from '../components/preview/ProductionPackTables';
import { useRequestSession } from '../context/RequestSessionContext';
import { publicPreviewStatuses, requestStatusMeta } from '../data/requestMeta';
import { useRequestRecord } from '../hooks/useRequestRecord';
import type { RequestStatus } from '../types/request';
import { buildHarnessPreviewModel } from '../utils/harnessPreviewModel';
import { updateRequest } from '../utils/requestApi';

const actionablePreviewStatuses = new Set<RequestStatus>([
  'draft-ready',
  'awaiting-confirmation',
]);

export function GeneratedPreviewPage() {
  const navigate = useNavigate();
  const params = useParams<{ requestId: string }>();
  const { refreshActiveRequest } = useRequestSession();
  const { request, requestId, isLoading, error, reload } = useRequestRecord(
    params.requestId,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleAction(nextStatus: RequestStatus) {
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
          : 'We could not update this request.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Generated Preview"
          description="Loading the generated harness preview."
          badge="Loading"
        />
        <section className="panel">
          <div className="empty-state">
            <strong>Loading preview...</strong>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Generated Preview"
          description="We could not load this preview."
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
          title="Generated Preview"
          description="Available after enough request detail has been captured."
          badge="Waiting"
        />
        <section className="panel">
          <div className="empty-state">
            <strong>No preview is available yet.</strong>
            <p>Start from AI Agent or the Configurator to continue.</p>
            <div className="action-row">
              <Link to="/ai-agent" className="button">
                Open AI Agent
              </Link>
              <Link to="/configurator" className="button button-secondary">
                Open Configurator
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!publicPreviewStatuses.has(request.status)) {
    return <Navigate to={`/processing/${request.id}`} replace />;
  }

  const preview = buildHarnessPreviewModel(request);
  const canRespond = actionablePreviewStatuses.has(request.status);
  const isSubmitted = request.status === 'order-submitted';

  return (
    <div className="page-stack">
      <PageHeader
        title="Generated Preview"
        description={
          canRespond
            ? 'Review the generated harness preview and continue when the order is ready.'
            : 'The generated harness preview remains available for reference.'
        }
        badge={requestStatusMeta[request.status].label}
      />

      <section className="preview-page preview-page--hero">
        <article className="panel preview-page__hero-panel">
          <div className="preview-page__hero-copy">
            <span className="eyebrow">{preview.sourceLabel}</span>
            <h2>{request.projectName}</h2>
            <p>{preview.summary}</p>
            <div className="preview-page__hero-meta">
              <span>{request.id}</span>
              <span>{preview.quantityLabel}</span>
              <span>{preview.leadTimeLabel}</span>
            </div>
          </div>
          <HarnessPreviewGraphic model={preview} className="preview-page__graphic" />
        </article>

        <aside className="panel preview-page__summary-panel">
          <div className="panel-heading">
            <h3>Generated summary</h3>
            <p>
              {canRespond
                ? 'The generated harness is ready for confirmation.'
                : 'This preview remains available while the order moves forward.'}
            </p>
          </div>

          <div className="summary-grid preview-page__summary-grid">
            <div className="summary-card">
              <span>Request ID</span>
              <strong>{request.id}</strong>
            </div>
            <div className="summary-card">
              <span>Quantity</span>
              <strong>{preview.quantityLabel}</strong>
            </div>
            <div className="summary-card">
              <span>Estimated price</span>
              <strong>{preview.quoteLabel}</strong>
            </div>
            <div className="summary-card">
              <span>Lead time</span>
              <strong>{preview.leadTimeLabel}</strong>
            </div>
            <div className="summary-card">
              <span>Connector families</span>
              <strong>{preview.connectorFamilies.join(' / ') || 'To confirm'}</strong>
            </div>
            <div className="summary-card">
              <span>Main wire spec</span>
              <strong>{preview.mainWireSpec}</strong>
            </div>
          </div>

          <div className="preview-page__detail-stack">
            <div className="preview-page__detail-block">
              <span className="eyebrow">Major assumptions</span>
              <ul className="simple-list">
                {preview.assumptions.length === 0 ? (
                  <li>No assumptions are currently listed.</li>
                ) : (
                  preview.assumptions.map((item) => <li key={item}>{item}</li>)
                )}
              </ul>
            </div>
            <div className="preview-page__detail-block">
              <span className="eyebrow">Missing confirmations</span>
              <ul className="simple-list">
                {preview.missingInfo.length === 0 ? (
                  <li>No open confirmations are currently listed.</li>
                ) : (
                  preview.missingInfo.map((item) => <li key={item}>{item}</li>)
                )}
              </ul>
            </div>
            <div className="preview-page__detail-block">
              <span className="eyebrow">Current request</span>
              <ul className="simple-list">
                <li>Source: {preview.sourceLabel}</li>
                <li>Attachments: {preview.attachmentsLabel}</li>
                <li>Protection: {preview.protectionLabel}</li>
                {request.manufacturableNotes ? (
                  <li>Manufacturing note: {request.manufacturableNotes}</li>
                ) : null}
              </ul>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel preview-page__production">
        <div className="panel-heading">
          <h3>Production Layout Preview</h3>
          <p>
            Flattened layout, reference structure, and preparation tables from the
            current harness request.
          </p>
        </div>
        <ProductionLayoutPreview model={preview} requestId={request.id} />
        <ProductionPackTables model={preview} />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Next action</h3>
          <p>
            {canRespond
              ? 'Place the order to continue, or request changes if one point still needs correction.'
              : isSubmitted
                ? 'Order received. Final handling and payment follow next.'
                : 'This preview remains available while the request moves through the next stage.'}
          </p>
        </div>
        {actionError ? (
          <div className="info-banner info-banner--error">{actionError}</div>
        ) : null}
        <div className="action-row">
          {canRespond ? (
            <>
              <button
                type="button"
                className="button"
                disabled={isSaving}
                onClick={() => void handleAction('order-submitted')}
              >
                {isSaving ? 'Saving...' : 'Place Order'}
              </button>
              <button
                type="button"
                className="button button-secondary"
                disabled={isSaving}
                onClick={() => void handleAction('draft-in-progress')}
              >
                Request Changes
              </button>
            </>
          ) : (
            <Link to={`/processing/${request.id}`} className="button">
              Track Request
            </Link>
          )}
          <button
            type="button"
            className="button button-ghost"
            onClick={() =>
              navigate(request.source === 'canvas' ? '/configurator' : '/ai-agent')
            }
          >
            Back
          </button>
        </div>
      </section>
    </div>
  );
}
