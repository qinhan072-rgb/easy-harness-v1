import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { usePrototype } from '../context/PrototypeContext';
import { useRequestSession } from '../context/RequestSessionContext';
import { leadTimePreferenceOptions } from '../data/uploadDrafts';
import { requestStatusMeta } from '../data/requestMeta';
import type { LeadTimePreference } from '../types/prototype';
import { createAiRequest } from '../utils/requestApi';

export function AIAgentPage() {
  const navigate = useNavigate();
  const { state } = usePrototype();
  const { activeRequest, setActiveRequestId } = useRequestSession();
  const [projectName, setProjectName] = useState('');
  const [requestSummary, setRequestSummary] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [leadTimePreference, setLeadTimePreference] =
    useState<LeadTimePreference>('standard');
  const [environmentNotes, setEnvironmentNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canvasContextLabel = useMemo(
    () =>
      `${state.canvasDraft.connectors.length} connectors, ${state.canvasDraft.midElements.length} elements, ${state.canvasDraft.wires.length} wires`,
    [
      state.canvasDraft.connectors.length,
      state.canvasDraft.midElements.length,
      state.canvasDraft.wires.length,
    ],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('projectName', projectName);
    formData.append('requestSummary', requestSummary);
    formData.append('quantity', String(quantity));
    formData.append('leadTimePreference', leadTimePreference);
    formData.append('environmentNotes', environmentNotes);

    selectedFiles.forEach((file) => {
      formData.append('attachments', file);
    });

    try {
      const request = await createAiRequest(formData);
      setActiveRequestId(request.id);
      navigate(`/processing/${request.id}`);
    } catch (submitError) {
      setFeedback(
        submitError instanceof Error
          ? submitError.message
          : 'We could not create the request.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="AI Agent"
        description="Describe the harness requirement in plain language and submit the intake record."
        badge="Primary intake"
      />

      <form className="panel-grid panel-grid--2" onSubmit={handleSubmit}>
        <article className="panel upload-form-panel">
          <div className="panel-heading">
            <h3>Describe the request</h3>
            <p>Provide the harness requirement, application context, quantity, and lead time preference in plain language.</p>
          </div>

          <label className="field">
            <span>Project name</span>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Example: EH Test Bench Harness"
            />
          </label>

          <label className="field">
            <span>Plain-language request</span>
            <textarea
              value={requestSummary}
              onChange={(event) => setRequestSummary(event.target.value)}
              placeholder="Describe the harness, connection points, constraints, and required outcome."
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Quantity</span>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Lead time preference</span>
              <select
                value={leadTimePreference}
                onChange={(event) =>
                  setLeadTimePreference(event.target.value as LeadTimePreference)
                }
              >
                {leadTimePreferenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Optional notes</span>
            <textarea
              value={environmentNotes}
              onChange={(event) => setEnvironmentNotes(event.target.value)}
              placeholder="Environment, installation notes, or other context."
            />
          </label>

          <div
            className={
              feedback ? 'info-banner info-banner--error' : 'info-banner info-banner--subtle'
            }
          >
            {feedback ??
              'Easy Harness will organize this intake record for quotation and draft preparation. Some requests may still be standardized manually during early access.'}
          </div>

          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting request...' : 'Submit Request'}
          </button>
        </article>

        <article className="panel upload-form-panel">
          <div className="panel-heading">
            <h3>Reference files and canvas handoff</h3>
            <p>Attach drawings, photos, BOMs, pinouts, or notes. A structured canvas setup can also continue here.</p>
          </div>

          <label className="field">
            <span>Attachments</span>
            <input
              type="file"
              multiple
              onChange={(event) =>
                setSelectedFiles(Array.from(event.target.files ?? []))
              }
            />
          </label>

          <div className="attachment-list">
            {selectedFiles.length === 0 ? (
              <div className="attachment-row">
                <span>No files selected yet.</span>
              </div>
            ) : (
              selectedFiles.map((file) => (
                <div key={`${file.name}-${file.size}`} className="attachment-row">
                  <span>{file.name}</span>
                  <span>{Math.round(file.size / 1024)} KB</span>
                </div>
              ))
            )}
          </div>

          <div className="panel-heading">
            <h3>Canvas handoff context</h3>
            <p>Continue from the current structured setup when the requirement extends beyond the canvas boundary.</p>
          </div>
          <ul className="simple-list">
            <li>Current canvas record: {canvasContextLabel}</li>
            <li>
              Recent request:{' '}
              {activeRequest
                ? `${activeRequest.projectName} (${requestStatusMeta[activeRequest.status].label})`
                : 'No request record yet'}
            </li>
          </ul>

          <div className="action-row">
            <Link to="/configurator" className="button button-secondary">
              Open Configurator Canvas
            </Link>
            <Link to="/upload" className="button button-secondary">
              Use Upload Intake
            </Link>
          </div>
        </article>
      </form>
    </div>
  );
}
