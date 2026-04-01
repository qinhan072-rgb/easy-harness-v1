import { Link } from 'react-router-dom';
import { OrderActionBar } from '../components/order/OrderActionBar';
import { PageHeader } from '../components/PageHeader';
import { usePrototype } from '../context/PrototypeContext';
import { orderStatusCopy } from '../data/mockOrderDrafts';

export function OrderConfirmationPage() {
  const { setOrderStatus, state } = usePrototype();

  if (!state.orderDraft) {
    return (
      <div className="page-stack">
        <PageHeader
          title="Order Confirmation"
          description="This page becomes available after a canvas or upload draft has been processed."
          badge="Waiting"
        />
        <section className="panel">
          <div className="empty-state">
            <strong>No draft order has been generated yet.</strong>
            <p>Complete the Configurator or Upload flow first, then come back here.</p>
            <Link to="/" className="button">
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const statusCopy = orderStatusCopy[state.orderDraft.status];

  return (
    <div className="page-stack">
      <PageHeader
        title="Order Confirmation"
        description="Review this draft as an order boundary check: source, harness summary, included items, assumptions, and any missing details before you confirm."
        badge={statusCopy.label}
      />

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Draft Snapshot</h3>
            <p>Core request framing for the current order draft.</p>
          </div>
          <div className="summary-grid">
            <div className="summary-card">
              <span>Request source</span>
              <strong>{state.orderDraft.sourceTitle}</strong>
            </div>
            <div className="summary-card">
              <span>Draft status</span>
              <strong>{statusCopy.label}</strong>
            </div>
            <div className="summary-card">
              <span>Quantity</span>
              <strong>{state.orderDraft.quantity}</strong>
            </div>
            <div className="summary-card">
              <span>Lead time preference</span>
              <strong>{state.orderDraft.leadTimePreference}</strong>
            </div>
          </div>
          <div className="draft-copy-group">
            <div>
              <span className="eyebrow">Harness summary</span>
              <p>{state.orderDraft.harnessSummary}</p>
            </div>
            <div>
              <span className="eyebrow">Order summary</span>
              <p>{state.orderDraft.summary}</p>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Draft Estimate And Notes</h3>
            <p>Commercial placeholders only. No real quote, payment, or order placement happens here.</p>
          </div>
          <div className="price-list">
            <div className="price-row">
              <span>Price estimate</span>
              <strong>{state.orderDraft.priceEstimate}</strong>
            </div>
            <div className="price-row">
              <span>Request source type</span>
              <strong>{state.orderDraft.sourceType}</strong>
            </div>
            <div className="price-row">
              <span>Draft note</span>
              <strong>{state.orderDraft.detailNote}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Included Connectors</h3>
          <p>Connector content captured in the current draft.</p>
        </div>
        <ul className="simple-list">
          {state.orderDraft.includedConnectors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Included Elements And Wires</h3>
          <p>The current draft structure, as it would be handed into review.</p>
        </div>
        <div className="panel-grid panel-grid--2">
          <div className="sub-panel">
            <span className="eyebrow">Elements</span>
            <ul className="simple-list">
              {state.orderDraft.includedElements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="sub-panel">
            <span className="eyebrow">Wires</span>
            <ul className="simple-list">
              {state.orderDraft.includedWires.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Known Assumptions</h3>
            <p>Important framing assumptions behind this draft.</p>
          </div>
          <ul className="simple-list">
            {state.orderDraft.knownAssumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Missing Details</h3>
            <p>Open items that still need confirmation before this could become a real order.</p>
          </div>
          <ul className="simple-list">
            {state.orderDraft.missingDetails.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Draft Decision</h3>
          <p>{statusCopy.description}</p>
        </div>
        {state.orderFeedback ? <div className="info-banner">{state.orderFeedback}</div> : null}
        <OrderActionBar
          onConfirm={() => setOrderStatus('confirmed')}
          onRequestChanges={() => setOrderStatus('changes-requested')}
        />
      </section>
    </div>
  );
}
