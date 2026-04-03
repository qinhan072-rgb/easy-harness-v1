import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useRequestSession } from '../context/RequestSessionContext';
import { usePrototype } from '../context/PrototypeContext';
import { leadTimePreferenceOptions } from '../data/uploadDrafts';
import { requestStatusMeta } from '../data/requestMeta';
import { createUploadRequest } from '../utils/requestApi';

export function UploadRequestPage() {
  const navigate = useNavigate();
  const { activeRequest, setActiveRequestId } = useRequestSession();
  const { state, updateUploadField } = usePrototype();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [environmentNotes, setEnvironmentNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('projectName', state.uploadDraft.projectName);
    formData.append('requestSummary', state.uploadDraft.description);
    formData.append('quantity', String(state.uploadDraft.quantity));
    formData.append(
      'leadTimePreference',
      state.uploadDraft.leadTimePreference,
    );
    formData.append('environmentNotes', environmentNotes);

    selectedFiles.forEach((file) => {
      formData.append('attachments', file);
    });

    try {
      const request = await createUploadRequest(formData);
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
        title="Upload Intake"
        description="Submit reference files and supporting notes as part of the intake record."
        badge="Upload intake"
      />

      <section className="panel">
        <div className="panel-heading">
          <h3>Reference-led intake</h3>
          <p>Upload drawings, photos, BOMs, pinouts, sketches, and mixed files when the request is best defined by documents.</p>
        </div>
        <div className="info-banner info-banner--subtle">
          Reference files are stored with the intake record for quotation review.
        </div>
        <div className="action-row">
          <Link to="/ai-agent" className="button">
            Continue with AI
          </Link>
          <Link to="/configurator" className="button button-secondary">
            Open Configurator Canvas
          </Link>
        </div>
      </section>

      <form className="panel-grid panel-grid--2" onSubmit={handleSubmit}>
        <article className="panel upload-form-panel">
          <div className="panel-heading">
            <h3>Request details</h3>
            <p>Provide the core request details, quantity, and timing requirements.</p>
          </div>
          <label className="field">
            <span>Project name</span>
            <input
              value={state.uploadDraft.projectName}
              onChange={(event) =>
                updateUploadField('projectName', event.target.value)
              }
              placeholder="Example: EH Battery Harness"
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              value={state.uploadDraft.description}
              onChange={(event) =>
                updateUploadField('description', event.target.value)
              }
              placeholder="Describe the harness request, scope, or known constraints."
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Quantity</span>
              <input
                type="number"
                min={1}
                value={state.uploadDraft.quantity}
                onChange={(event) =>
                  updateUploadField('quantity', Number(event.target.value))
                }
              />
            </label>

            <label className="field">
              <span>Lead time preference</span>
              <select
                value={state.uploadDraft.leadTimePreference}
                onChange={(event) =>
                  updateUploadField(
                    'leadTimePreference',
                    event.target
                      .value as (typeof leadTimePreferenceOptions)[number]['value'],
                  )
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
            <span>Environment or install notes</span>
            <textarea
              value={environmentNotes}
              onChange={(event) => setEnvironmentNotes(event.target.value)}
              placeholder="Operating environment, installation constraints, or assembly context."
            />
          </label>

          <div
            className={
              feedback
                ? 'info-banner info-banner--error'
                : 'info-banner info-banner--subtle'
            }
          >
            {feedback ??
              'The intake record will include your notes, quantity, lead time preference, and reference files.'}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Reference Files</h3>
            <p>Add the files that define the requirement most clearly.</p>
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
            <h3>Selected files and request record</h3>
            <p>Review the selected file count and the most recent request record.</p>
          </div>
          <ul className="simple-list">
            <li>
              Recent request:{' '}
              {activeRequest
                ? `${activeRequest.projectName} (${requestStatusMeta[activeRequest.status].label})`
                : 'No request record yet'}
            </li>
            <li>Files selected: {selectedFiles.length}</li>
          </ul>
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting request...' : 'Submit Request'}
          </button>
        </article>
      </form>
    </div>
  );
}
