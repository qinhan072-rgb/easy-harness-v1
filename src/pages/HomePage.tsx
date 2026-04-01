import { Link } from 'react-router-dom';
import { usePrototype } from '../context/PrototypeContext';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { orderStatusCopy } from '../data/mockOrderDrafts';

export function HomePage() {
  const { state } = usePrototype();
  const metrics = [
    {
      label: 'Connector blocks',
      value: String(state.canvasDraft.connectors.length),
      hint: 'Currently in canvas draft',
    },
    {
      label: 'Wire connections',
      value: String(state.canvasDraft.wires.length),
      hint: 'Fake wire objects ready for quote',
    },
    {
      label: 'Attachments',
      value: String(state.uploadDraft.attachments.length),
      hint: 'Upload placeholders collected',
    },
    {
      label: 'Order draft',
      value: state.orderDraft ? '1' : '0',
      hint: state.orderDraft
        ? orderStatusCopy[state.orderDraft.status].label
        : 'No active draft',
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="Home"
        description="Choose a starting path, build a fake draft, and walk it all the way through processing and order confirmation."
        badge="Flow entry"
      />

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Start a Canvas Flow</h3>
            <p>Build connector blocks, mid elements, and wire connections directly in the fixed-syntax canvas.</p>
          </div>
          <div className="route-card route-card--primary">
            <strong>Configurator Canvas</strong>
            <p>Create a minimum harness structure and push it into the fake processing queue.</p>
            <Link to="/configurator" className="button button-secondary">
              Open Configurator
            </Link>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Start an Upload Flow</h3>
            <p>Fill a lightweight request form and generate a front-end-only draft order from upload data.</p>
          </div>
          <div className="route-card route-card--primary">
            <strong>Upload / Assisted Request</strong>
            <p>Use the lightweight form, attachment placeholders, quantity, and lead time inputs.</p>
            <Link to="/upload" className="button button-secondary">
              Open Upload Flow
            </Link>
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Current Prototype Flow</h3>
            <p>Track the most recent front-end-only draft across the shared workflow state.</p>
          </div>
          <ul className="simple-list">
            <li>
              Active source:{' '}
              {state.orderDraft ? state.orderDraft.sourceTitle : 'No draft started'}
            </li>
            <li>
              Processing state:{' '}
              {state.processingInfo ? state.processingInfo.etaLabel : 'Waiting for a submission'}
            </li>
            <li>
              Order status:{' '}
              {state.orderDraft
                ? orderStatusCopy[state.orderDraft.status].label
                : 'Not available yet'}
            </li>
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Continue the Demo</h3>
            <p>Jump into the later steps if a draft already exists.</p>
          </div>
          <div className="route-list">
            <Link to="/processing" className="route-card">
              <strong>Processing Status</strong>
              <span>Review current processing step</span>
            </Link>
            <Link to="/order-confirmation" className="route-card">
              <strong>Order Confirmation</strong>
              <span>Inspect the generated draft order</span>
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
