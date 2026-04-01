import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StatusTimeline } from '../components/StatusTimeline';
import { usePrototype } from '../context/PrototypeContext';

export function ProcessingStatusPage() {
  const { state } = usePrototype();

  if (!state.processingInfo || !state.orderDraft) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Processing Status"
          description="This page becomes active after a canvas or upload draft is submitted."
          badge="Waiting"
        />
        <section className="panel">
          <div className="empty-state">
            <strong>No order draft is being processed yet.</strong>
            <p>Start from Home, Configurator Canvas, or Upload / Assisted Request to create one.</p>
            <Link to="/" className="button">
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Processing Status"
        description="Track the fake processing step that turns the current request into a draft order."
        badge="In progress"
      />

      <section className="panel processing-hero">
        <div>
          <span className="eyebrow">Current draft</span>
          <h3>{state.processingInfo.title}</h3>
          <p>{state.processingInfo.detail}</p>
        </div>
        <div className="processing-hero__meta">
          <strong>{state.processingInfo.etaLabel}</strong>
          <span>Source: {state.orderDraft.sourceTitle}</span>
        </div>
      </section>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Pipeline Timeline</h3>
            <p>System is organizing your draft order with front-end-only steps.</p>
          </div>
          <StatusTimeline items={state.processingInfo.timeline} />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Active Jobs</h3>
            <p>Fake processing jobs tied to the selected flow source.</p>
          </div>
          <div className="job-list">
            {state.processingInfo.jobs.map((job) => (
              <div key={job.title} className="job-card">
                <strong>{job.title}</strong>
                <span>{job.owner}</span>
                <p>{job.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Next Step</h3>
          <p>Move into Order Confirmation to review the generated draft.</p>
        </div>
        <Link to="/order-confirmation" className="button">
          Go to Order Confirmation
        </Link>
      </section>
    </div>
  );
}
