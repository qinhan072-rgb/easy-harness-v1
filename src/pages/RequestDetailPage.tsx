import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useOpsAccess } from '../context/OpsAccessContext';
import { useRequestSession } from '../context/RequestSessionContext';
import {
  formatRequestTimestamp,
  requestSourceLabels,
  requestStatusMeta,
  requestStatusOptions,
} from '../data/requestMeta';
import { useRequestRecord } from '../hooks/useRequestRecord';
import type { RequestStatus } from '../types/request';
import { exportOpsRequestWorkbook, updateRequest } from '../utils/requestApi';

function joinLines(values: string[]) {
  return values.join('\n');
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function RequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const { opsPasscode } = useOpsAccess();
  const { refreshActiveRequest } = useRequestSession();
  const { request, isLoading, error, reload } = useRequestRecord(params.requestId);
  const [status, setStatus] = useState<RequestStatus>('new');
  const [draftSummary, setDraftSummary] = useState('');
  const [manufacturableNotes, setManufacturableNotes] = useState('');
  const [quotePlaceholder, setQuotePlaceholder] = useState('');
  const [leadTimeNote, setLeadTimeNote] = useState('');
  const [assumptionsText, setAssumptionsText] = useState('');
  const [missingInfoText, setMissingInfoText] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!request) {
      return;
    }

    setStatus(request.status);
    setDraftSummary(request.draftSummary ?? '');
    setManufacturableNotes(request.manufacturableNotes ?? '');
    setQuotePlaceholder(request.quotePlaceholder ?? '');
    setLeadTimeNote(request.leadTimeNote ?? '');
    setAssumptionsText(joinLines(request.assumptions));
    setMissingInfoText(joinLines(request.missingInfo));
    setInternalNotes(request.internalNotes);
    setFeedback(null);
  }, [request]);

  function buildDraftPayload() {
    return {
      status,
      draftSummary,
      manufacturableNotes,
      quotePlaceholder,
      leadTimeNote,
      assumptions: splitLines(assumptionsText),
      missingInfo: splitLines(missingInfoText),
      internalNotes,
    };
  }

  async function handleSave() {
    if (!request) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await updateRequest(request.id, buildDraftPayload());
      await reload();
      await refreshActiveRequest();
      setFeedback('Record updated.');
    } catch (saveError) {
      setFeedback(
        saveError instanceof Error
          ? saveError.message
          : 'We could not save your changes.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExportWorkbook() {
    if (!request || !opsPasscode) {
      setFeedback('Ops access has expired. Re-enter the passcode before exporting.');
      return;
    }

    setIsExporting(true);
    setFeedback(null);

    try {
      const workbookBlob = await exportOpsRequestWorkbook(
        request.id,
        opsPasscode,
        buildDraftPayload(),
      );
      const blobUrl = window.URL.createObjectURL(workbookBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${request.projectName || request.id}-${request.id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      setFeedback('Editable handoff workbook downloaded.');
    } catch (exportError) {
      setFeedback(
        exportError instanceof Error
          ? exportError.message
          : 'We could not export the handoff workbook.',
      );
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Request Detail"
          description="Loading the selected request."
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

  if (error || !request) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Request Detail"
          description="We could not load this request."
          badge="Unavailable"
        />
        <section className="panel">
          <div className="info-banner info-banner--error">
            {error ?? 'Request not found.'}
          </div>
          <Link to="/ops/requests" className="button">
            Back to Inbox
          </Link>
        </section>
      </div>
    );
  }

  const structuredSummary = draftSummary || request.requestSummary;
  const customerDraftPath =
    request.source === 'canvas'
      ? `/review-order/${request.id}`
      : `/order-confirmation/${request.id}`;
  const customerDraftLabel =
    request.source === 'canvas' ? 'View Order Review' : 'View Order Draft';

  return (
    <div className="page-stack">
      <PageHeader
        title={request.projectName}
        description="Review the intake record, prepare the draft, and assemble the handoff."
        badge={requestStatusMeta[request.status].label}
      />

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Customer Intake</h3>
            <p>Review the submitted request before standardization.</p>
          </div>
          <div className="summary-grid">
            <div className="summary-card">
              <span>Request ID</span>
              <strong>{request.id}</strong>
            </div>
            <div className="summary-card">
              <span>Source</span>
              <strong>{requestSourceLabels[request.source]}</strong>
            </div>
            <div className="summary-card">
              <span>Created</span>
              <strong>{formatRequestTimestamp(request.createdAt)}</strong>
            </div>
            <div className="summary-card">
              <span>Updated</span>
              <strong>{formatRequestTimestamp(request.updatedAt)}</strong>
            </div>
            <div className="summary-card">
              <span>Quantity</span>
              <strong>{request.quantity}</strong>
            </div>
            <div className="summary-card">
              <span>Lead time</span>
              <strong>{request.leadTimePreference}</strong>
            </div>
          </div>

          <div className="draft-copy-group">
            <div>
              <span className="eyebrow">Original request summary</span>
              <p>{request.requestSummary}</p>
            </div>
            {request.source === 'ai' ? (
              <div>
                <span className="eyebrow">AI request text</span>
                <p>{request.requestSummary}</p>
              </div>
            ) : null}
            <div>
              <span className="eyebrow">Intended use</span>
              <p>{request.intendedUse || 'Not specified yet.'}</p>
            </div>
            <div>
              <span className="eyebrow">Environment notes</span>
              <p>{request.environmentNotes || 'No environment notes yet.'}</p>
            </div>
          </div>

          {request.source === 'canvas' ? (
            <div className="sub-panel">
              <span className="eyebrow">Canvas snapshot summary</span>
              {request.canvasSnapshot ? (
                <ul className="simple-list">
                  <li>Connectors: {request.canvasSnapshot.connectors.length}</li>
                  <li>Mid elements: {request.canvasSnapshot.midElements.length}</li>
                  <li>Wires: {request.canvasSnapshot.wires.length}</li>
                </ul>
              ) : (
                <p>No canvas snapshot was saved with this request.</p>
              )}
            </div>
          ) : null}

          {request.source === 'upload' ? (
            <div className="sub-panel">
              <span className="eyebrow">Uploaded files</span>
              {request.attachments.length === 0 ? (
                <p>No files uploaded with this request.</p>
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
            </div>
          ) : null}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Draft preparation</h3>
            <p>Standardize the intake record, capture open items, and prepare the handoff workbook.</p>
          </div>
          <div className="request-inline-form">
            <label className="field">
              <span>Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as RequestStatus)}
              >
                {requestStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Draft summary</span>
              <textarea
                value={draftSummary}
                onChange={(event) => setDraftSummary(event.target.value)}
                placeholder="Write the standardized draft summary the user and team should align on."
              />
            </label>

            <label className="field">
              <span>Manufacturable notes</span>
              <textarea
                value={manufacturableNotes}
                onChange={(event) => setManufacturableNotes(event.target.value)}
                placeholder="Document build notes, routing assumptions, part substitutions, or manufacturing constraints."
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span>Quote placeholder</span>
                <input
                  value={quotePlaceholder}
                  onChange={(event) => setQuotePlaceholder(event.target.value)}
                  placeholder="Example: $1,250 placeholder"
                />
              </label>

              <label className="field">
                <span>Lead time note</span>
                <input
                  value={leadTimeNote}
                  onChange={(event) => setLeadTimeNote(event.target.value)}
                  placeholder="Example: 7 business days after connector confirmation"
                />
              </label>
            </div>

            <label className="field">
              <span>Assumptions</span>
              <textarea
                value={assumptionsText}
                onChange={(event) => setAssumptionsText(event.target.value)}
                placeholder="One assumption per line."
              />
            </label>

            <label className="field">
              <span>Missing info</span>
              <textarea
                value={missingInfoText}
                onChange={(event) => setMissingInfoText(event.target.value)}
                placeholder="One missing item per line."
              />
            </label>

            <label className="field">
              <span>Internal notes</span>
              <textarea
                value={internalNotes}
                onChange={(event) => setInternalNotes(event.target.value)}
                placeholder="Add internal review notes, follow-up items, or operator context."
              />
            </label>

            <div
              className={
                feedback === 'Record updated.' || feedback === 'Editable handoff workbook downloaded.'
                  ? 'info-banner info-banner--subtle'
                  : feedback
                    ? 'info-banner info-banner--error'
                    : 'info-banner info-banner--subtle'
              }
            >
              {feedback ??
                'Save changes to update status, draft content, and handoff notes.'}
            </div>

            <button
              type="button"
              className="button"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={isExporting}
              onClick={() => void handleExportWorkbook()}
            >
              {isExporting ? 'Exporting XLSX...' : 'Export Editable XLSX'}
            </button>
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Structured items</h3>
            <p>Structured information captured with the intake record.</p>
          </div>
          <div className="panel-grid panel-grid--2">
            <div className="sub-panel">
              <span className="eyebrow">Connectors</span>
              <ul className="simple-list">
                {request.knownConnectors.length === 0 ? (
                  <li>No connector list yet.</li>
                ) : (
                  request.knownConnectors.map((item) => <li key={item}>{item}</li>)
                )}
              </ul>
            </div>
            <div className="sub-panel">
              <span className="eyebrow">Elements</span>
              <ul className="simple-list">
                {request.knownElements.length === 0 ? (
                  <li>No element list yet.</li>
                ) : (
                  request.knownElements.map((item) => <li key={item}>{item}</li>)
                )}
              </ul>
            </div>
            <div className="sub-panel">
              <span className="eyebrow">Wires</span>
              <ul className="simple-list">
                {request.knownWires.length === 0 ? (
                  <li>No wire list yet.</li>
                ) : (
                  request.knownWires.map((item) => <li key={item}>{item}</li>)
                )}
              </ul>
            </div>
            <div className="sub-panel">
              <span className="eyebrow">Attachments</span>
              <p>
                {request.attachments.length > 0
                  ? `${request.attachments.length} file(s) attached.`
                  : 'No files attached to this request.'}
              </p>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Handoff preview</h3>
            <p>Review the editable handoff content before export.</p>
          </div>

          <div className="manufacturing-view">
            <div className="manufacturing-view__grid">
              <div>
                <span className="eyebrow">Request ID</span>
                <strong>{request.id}</strong>
              </div>
              <div>
                <span className="eyebrow">Project</span>
                <strong>{request.projectName}</strong>
              </div>
              <div>
                <span className="eyebrow">Source</span>
                <strong>{requestSourceLabels[request.source]}</strong>
              </div>
              <div>
                <span className="eyebrow">Quantity</span>
                <strong>{request.quantity}</strong>
              </div>
              <div>
                <span className="eyebrow">Lead Time</span>
                <strong>{request.leadTimePreference}</strong>
              </div>
              <div>
                <span className="eyebrow">Lead Time Note</span>
                <strong>{leadTimeNote || 'Not prepared yet.'}</strong>
              </div>
            </div>

            <div className="manufacturing-view__section">
              <span className="eyebrow">Structured summary</span>
              <p>{structuredSummary || 'Draft summary has not been prepared yet.'}</p>
            </div>
            <div className="manufacturing-view__section">
              <span className="eyebrow">Intended use</span>
              <p>{request.intendedUse || 'Not specified yet.'}</p>
            </div>
            <div className="manufacturing-view__section">
              <span className="eyebrow">Environment notes</span>
              <p>{request.environmentNotes || 'No environment notes yet.'}</p>
            </div>
            <div className="manufacturing-view__section">
              <span className="eyebrow">Manufacturable notes</span>
              <p>{manufacturableNotes || 'Manufacturable notes have not been prepared yet.'}</p>
            </div>
            <div className="manufacturing-view__section">
              <span className="eyebrow">Quote placeholder</span>
              <p>{quotePlaceholder || 'No quote placeholder yet.'}</p>
            </div>
            <div className="manufacturing-view__section">
              <span className="eyebrow">Known connectors / elements / wires</span>
              <ul className="simple-list">
                {request.knownConnectors.map((item) => (
                  <li key={`connector-${item}`}>{item}</li>
                ))}
                {request.knownElements.map((item) => (
                  <li key={`element-${item}`}>{item}</li>
                ))}
                {request.knownWires.map((item) => (
                  <li key={`wire-${item}`}>{item}</li>
                ))}
                {request.knownConnectors.length === 0 &&
                request.knownElements.length === 0 &&
                request.knownWires.length === 0 ? (
                  <li>No structured items have been prepared yet.</li>
                ) : null}
              </ul>
            </div>
            <div className="manufacturing-view__section">
              <span className="eyebrow">Assumptions</span>
              <ul className="simple-list">
                {splitLines(assumptionsText).length === 0 ? (
                  <li>No assumptions documented yet.</li>
                ) : (
                  splitLines(assumptionsText).map((item) => <li key={item}>{item}</li>)
                )}
              </ul>
            </div>
            <div className="manufacturing-view__section">
              <span className="eyebrow">Missing info</span>
              <ul className="simple-list">
                {splitLines(missingInfoText).length === 0 ? (
                  <li>No missing-info items documented yet.</li>
                ) : (
                  splitLines(missingInfoText).map((item) => <li key={item}>{item}</li>)
                )}
              </ul>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Customer links</h3>
          <p>Open the customer-facing request status or draft review for this record.</p>
        </div>
        <div className="action-row">
          <Link to={`/processing/${request.id}`} className="button">
            View Request Status
          </Link>
          <Link
            to={customerDraftPath}
            className="button button-secondary"
          >
            {customerDraftLabel}
          </Link>
          <Link to="/ops/requests" className="button button-ghost">
            Back to Inbox
          </Link>
        </div>
      </section>
    </div>
  );
}
