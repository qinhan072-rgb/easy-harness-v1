import { type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { usePrototype } from '../context/PrototypeContext';
import {
  attachmentPlaceholderOptions,
  leadTimePreferenceOptions,
} from '../data/uploadDrafts';

export function UploadRequestPage() {
  const navigate = useNavigate();
  const {
    addAttachmentPlaceholder,
    removeAttachmentPlaceholder,
    state,
    submitUpload,
    updateUploadField,
  } = usePrototype();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = submitUpload();

    if (result.ok) {
      navigate('/processing');
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Upload / Assisted Request"
        description="Fill a lightweight intake form, attach placeholder files, and submit a fake request into processing."
        badge="Upload flow"
      />

      <form className="panel-grid panel-grid--2" onSubmit={handleSubmit}>
        <article className="panel upload-form-panel">
          <div className="panel-heading">
            <h3>Request Form</h3>
            <p>Keep this intentionally lightweight for the V1 fake interaction flow.</p>
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
                    event.target.value as (typeof leadTimePreferenceOptions)[number]['value'],
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

          <div
            className={
              state.uploadFeedback &&
              (state.uploadFeedback.includes('required') ||
                state.uploadFeedback.includes('must'))
                ? 'info-banner info-banner--error'
                : 'info-banner'
            }
          >
            {state.uploadFeedback ??
              'Fill the request form and attach placeholder files before submitting.'}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Attachments Placeholder</h3>
            <p>Add mock attachments to simulate the assisted request intake.</p>
          </div>

          <div className="tag-list">
            {attachmentPlaceholderOptions.map((attachment) => (
              <button
                key={attachment}
                type="button"
                className="tag-button"
                onClick={() => addAttachmentPlaceholder(attachment)}
              >
                + {attachment}
              </button>
            ))}
          </div>

          <div className="dropzone">
            <strong>Attachment placeholders</strong>
            <p>
              {state.uploadDraft.attachments.length > 0
                ? 'These are mock entries only and do not upload real files.'
                : 'No placeholders added yet.'}
            </p>
          </div>

          <div className="attachment-list">
            {state.uploadDraft.attachments.map((attachment) => (
              <div key={attachment} className="attachment-row">
                <span>{attachment}</span>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => removeAttachmentPlaceholder(attachment)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="panel-heading">
            <h3>Submit Flow</h3>
            <p>Submitting the form creates a fake order draft and moves to Processing.</p>
          </div>
          <button type="submit" className="button">
            Submit Request
          </button>
        </article>
      </form>
    </div>
  );
}
