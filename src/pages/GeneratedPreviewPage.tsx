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

type PreviewView = 'harness' | 'production' | 'details';

const actionablePreviewStatuses = new Set<RequestStatus>([
  'draft-ready',
  'awaiting-confirmation',
]);

function getSourceLabel(source: 'ai' | 'canvas' | 'upload') {
  if (source === 'canvas') {
    return 'Configurator';
  }

  return 'AI Agent';
}

export function GeneratedPreviewPage() {
  const navigate = useNavigate();
  const params = useParams<{ requestId: string }>();
  const { refreshActiveRequest } = useRequestSession();
  const { request, requestId, isLoading, error, reload } = useRequestRecord(
    params.requestId,
  );
  const [activeView, setActiveView] = useState<PreviewView>('harness');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleStatusAction(nextStatus: RequestStatus) {
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
          : 'The request could not be updated.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Generated Confirmation"
          description="Loading the generated harness confirmation."
          badge="Loading"
        />
        <section className="panel">
          <div className="empty-state">
            <strong>Loading generated result...</strong>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Generated Confirmation"
          description="We could not load this generated result."
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
          title="Generated Confirmation"
          description="Available after a request has enough detail for preview generation."
          badge="Waiting"
        />
        <section className="panel">
          <div className="empty-state">
            <strong>No generated result is available yet.</strong>
            <p>Start from AI Agent or Configurator to continue.</p>
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
  const sourceLabel = getSourceLabel(request.source);
  const openItemCount = preview.assumptions.length + preview.missingInfo.length;
  const connectorSummary =
    preview.connectorTable.length > 0
      ? preview.connectorTable
          .map((connector) => `${connector.role}: ${connector.family}`)
          .join(', ')
      : 'Connector details to confirm';
  const wireSummary =
    preview.wireTable.length > 0
      ? preview.wireTable
          .map((wire) => `${wire.label} ${wire.lengthLabel}`)
          .join(', ')
      : 'Wire lengths to confirm';
  const primaryActionLabel = isSaving ? 'Saving...' : 'Confirm and Continue';
  const viewButtons: Array<{ id: PreviewView; label: string; helper: string }> = [
    {
      id: 'harness',
      label: 'Harness Preview',
      helper: 'Customer-facing generated result',
    },
    {
      id: 'production',
      label: 'Production Preview',
      helper: 'Flattened manufacturing layout',
    },
    {
      id: 'details',
      label: 'Details',
      helper: 'Structured confirmation data',
    },
  ];
  const checklist = [
    {
      title: 'Connectors',
      detail: connectorSummary,
      items: preview.connectorTable.map(
        (connector) =>
          `${connector.role}: ${connector.label} / ${connector.family} / ${connector.detail}`,
      ),
    },
    {
      title: 'Structure',
      detail: preview.hasBranch
        ? 'Main trunk with one visible branch path.'
        : 'Single left-to-right harness path.',
      items: [
        `${preview.elements.length} inline or protection item(s) shown in the generated result.`,
      ],
    },
    {
      title: 'Lengths',
      detail: wireSummary,
      items: preview.wireTable.map(
        (wire) => `${wire.routeLabel}: ${wire.lengthLabel}`,
      ),
    },
    {
      title: 'Materials & Protection',
      detail: `${preview.mainWireSpec} with ${preview.protectionLabel}.`,
      items: [
        `Main wire spec: ${preview.mainWireSpec}`,
        `Protection: ${preview.protectionLabel}`,
      ],
    },
    {
      title: 'AI Assumptions & Open Items',
      detail:
        openItemCount === 0
          ? 'No open confirmations are currently listed.'
          : `${openItemCount} assumption or confirmation item(s).`,
      items: [
        ...preview.assumptions.map((item) => `Assumption: ${item}`),
        ...preview.missingInfo.map((item) => `Open item: ${item}`),
      ],
    },
  ];

  return (
    <div className="page-stack generated-confirmation">
      <section className="panel generated-confirmation__masthead">
        <div className="generated-confirmation__masthead-copy">
          <span className="eyebrow">Ready for confirmation</span>
          <h1>Generated harness preview</h1>
          <p>
            Review the generated harness result, production layout preview, and
            confirmation checklist before continuing.
          </p>
          <div className="generated-confirmation__meta-strip">
            <span>{request.projectName}</span>
            <span>{request.id}</span>
            <span>{sourceLabel}</span>
          </div>
        </div>
        <div className="generated-confirmation__status-card">
          <span>Stage</span>
          <strong>
            {canRespond
              ? 'Ready for confirmation'
              : requestStatusMeta[request.status].label}
          </strong>
          <p>
            {isSubmitted
              ? 'The generated order has moved into final handling.'
              : canRespond
                ? 'Confirm the generated result, request a revision, or ask for engineering review.'
                : 'The generated result remains available while the request moves forward.'}
          </p>
        </div>
      </section>

      <section className="generated-confirmation__main">
        <article className="panel generated-confirmation__visual-panel">
          <div className="generated-confirmation__view-tabs" role="tablist">
            {viewButtons.map((view) => (
              <button
                key={view.id}
                type="button"
                className={
                  activeView === view.id
                    ? 'generated-confirmation__view-tab is-active'
                    : 'generated-confirmation__view-tab'
                }
                onClick={() => setActiveView(view.id)}
              >
                <strong>{view.label}</strong>
                <span>{view.helper}</span>
              </button>
            ))}
          </div>

          {activeView === 'harness' ? (
            <div className="generated-confirmation__view generated-confirmation__view--harness">
              <HarnessPreviewGraphic
                model={preview}
                className="generated-confirmation__harness-graphic"
              />
            </div>
          ) : null}

          {activeView === 'production' ? (
            <div className="generated-confirmation__view">
              <ProductionLayoutPreview model={preview} requestId={request.id} />
              <div className="generated-confirmation__production-note">
                <strong>Production Layout Preview</strong>
                <p>
                  Flattened routing, connector markers, segment labels, and
                  reference dimensions prepared from the current request.
                </p>
              </div>
            </div>
          ) : null}

          {activeView === 'details' ? (
            <div className="generated-confirmation__view">
              <ProductionPackTables model={preview} />
            </div>
          ) : null}
        </article>

        <aside className="panel generated-confirmation__summary-panel">
          <div className="panel-heading">
            <h3>Generated Summary</h3>
            <p>Key values prepared for confirmation.</p>
          </div>
          <div className="generated-confirmation__summary-grid">
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
              <span>Source</span>
              <strong>{sourceLabel}</strong>
            </div>
            <div className="summary-card">
              <span>Attachments</span>
              <strong>{preview.attachmentsLabel}</strong>
            </div>
            <div className="summary-card">
              <span>Open items</span>
              <strong>{openItemCount}</strong>
            </div>
          </div>
          <div className="generated-confirmation__summary-copy">
            <span className="eyebrow">Structured summary</span>
            <p>{preview.summary}</p>
          </div>
          <div className="generated-confirmation__summary-copy">
            <span className="eyebrow">Connector families</span>
            <p>{preview.connectorFamilies.join(' / ') || 'To confirm'}</p>
          </div>
        </aside>
      </section>

      <section className="panel generated-confirmation__checklist">
        <div className="panel-heading">
          <h3>Confirmation Checklist</h3>
          <p>Review the main points before continuing toward order handling.</p>
        </div>
        <div className="generated-confirmation__checklist-grid">
          {checklist.map((section) => (
            <article
              key={section.title}
              className="generated-confirmation__check-card"
            >
              <div>
                <span className="eyebrow">{section.title}</span>
                <p>{section.detail}</p>
              </div>
              <ul className="simple-list">
                {section.items.length === 0 ? (
                  <li>No additional items listed.</li>
                ) : (
                  section.items.slice(0, 4).map((item) => <li key={item}>{item}</li>)
                )}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="panel generated-confirmation__decision">
        <div>
          <span className="eyebrow">Decision</span>
          <h3>
            {canRespond
              ? 'Confirm the generated result or send it back for revision.'
              : isSubmitted
                ? 'Generated result confirmed.'
                : 'Generated result available for reference.'}
          </h3>
          <p>
            {canRespond
              ? 'Confirming moves this harness into order continuation. Revision keeps the request open for preparation.'
              : isSubmitted
                ? 'Payment preparation and final handling are next.'
                : 'Track the request for the current stage and next action.'}
          </p>
        </div>

        {actionError ? (
          <div className="info-banner info-banner--error">{actionError}</div>
        ) : null}

        <div className="generated-confirmation__actions">
          {canRespond ? (
            <>
              <button
                type="button"
                className="button"
                disabled={isSaving}
                onClick={() => void handleStatusAction('order-submitted')}
              >
                {primaryActionLabel}
              </button>
              <button
                type="button"
                className="button button-secondary"
                disabled={isSaving}
                onClick={() =>
                  navigate(request.source === 'canvas' ? '/configurator' : '/ai-agent')
                }
              >
                Revise Requirement
              </button>
              <button
                type="button"
                className="button button-ghost"
                disabled={isSaving}
                onClick={() => void handleStatusAction('draft-in-progress')}
              >
                Request Engineering Review
              </button>
            </>
          ) : (
            <Link to={`/processing/${request.id}`} className="button">
              Track Request
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
