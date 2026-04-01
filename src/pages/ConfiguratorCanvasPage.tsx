import { Link, useNavigate } from 'react-router-dom';
import { CanvasLane } from '../components/canvas/CanvasLane';
import { ConnectorBlockCard } from '../components/canvas/ConnectorBlockCard';
import { ConnectorBuilderForm } from '../components/canvas/ConnectorBuilderForm';
import { MidElementBlockCard } from '../components/canvas/MidElementBlockCard';
import { MidElementBuilderForm } from '../components/canvas/MidElementBuilderForm';
import { QuoteSummaryBar } from '../components/canvas/QuoteSummaryBar';
import { WireBuilderForm } from '../components/canvas/WireBuilderForm';
import { WireConnectionCard } from '../components/canvas/WireConnectionCard';
import { PageHeader } from '../components/PageHeader';
import { usePrototype } from '../context/PrototypeContext';
import { canvasV1Scope } from '../data/canvasCatalog';
import { getCanvasNodeById } from '../utils/prototypeBuilders';

export function ConfiguratorCanvasPage() {
  const navigate = useNavigate();
  const { addConnector, addMidElement, addWire, allCanvasNodes, canvasEvaluation, state, submitCanvas } =
    usePrototype();
  const leftConnectors = state.canvasDraft.connectors.filter(
    (connector) => connector.zone === 'left',
  );
  const rightConnectors = state.canvasDraft.connectors.filter(
    (connector) => connector.zone === 'right',
  );
  const columnOne = state.canvasDraft.midElements.filter(
    (midElement) => midElement.column === 1,
  );
  const columnTwo = state.canvasDraft.midElements.filter(
    (midElement) => midElement.column === 2,
  );
  const columnThree = state.canvasDraft.midElements.filter(
    (midElement) => midElement.column === 3,
  );

  function handleSubmit() {
    const result = submitCanvas();

    if (result.ok) {
      navigate('/processing');
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Configurator Canvas"
        description="Build a narrow V1 orderable path. You need a configured connector on each side and at least one valid left-to-right harness chain before submission."
        badge={canvasEvaluation.status}
      />

      <section className="canvas-shell">
        <div className="canvas-editor">
          <article className="panel">
            <div className="panel-heading">
              <h3>Add Connector Block</h3>
              <p>V1 only supports a small connector family subset. Leaving required details blank will keep the block incomplete.</p>
            </div>
            <ConnectorBuilderForm onAdd={addConnector} />
          </article>

          <article className="panel">
            <div className="panel-heading">
              <h3>Add Mid Element</h3>
              <p>Use the three fixed columns for splice, cable, fuse, or sleeve blocks only.</p>
            </div>
            <MidElementBuilderForm onAdd={addMidElement} />
          </article>

          <article className="panel">
            <div className="panel-heading">
              <h3>Create Wire Connection</h3>
              <p>Connect blocks left-to-right with the minimum wire object fields.</p>
            </div>
            <WireBuilderForm nodes={allCanvasNodes} onAdd={addWire} />
          </article>
        </div>

        <article className="panel">
          <div className="panel-heading">
            <h3>Canvas V1</h3>
            <p>Fixed syntax layout with left and right connector zones plus three mid-element columns.</p>
          </div>

          <div className="canvas-grid">
            <CanvasLane
              title="Left connector zone"
              subtitle="Source blocks"
              emptyMessage="No left connectors yet."
            >
              {leftConnectors.map((connector) => (
                <ConnectorBlockCard key={connector.id} connector={connector} />
              ))}
            </CanvasLane>

            <CanvasLane
              title="Mid column 1"
              subtitle="Fixed slot"
              emptyMessage="Column 1 is empty."
            >
              {columnOne.map((midElement) => (
                <MidElementBlockCard key={midElement.id} midElement={midElement} />
              ))}
            </CanvasLane>

            <CanvasLane
              title="Mid column 2"
              subtitle="Fixed slot"
              emptyMessage="Column 2 is empty."
            >
              {columnTwo.map((midElement) => (
                <MidElementBlockCard key={midElement.id} midElement={midElement} />
              ))}
            </CanvasLane>

            <CanvasLane
              title="Mid column 3"
              subtitle="Fixed slot"
              emptyMessage="Column 3 is empty."
            >
              {columnThree.map((midElement) => (
                <MidElementBlockCard key={midElement.id} midElement={midElement} />
              ))}
            </CanvasLane>

            <CanvasLane
              title="Right connector zone"
              subtitle="Destination blocks"
              emptyMessage="No right connectors yet."
            >
              {rightConnectors.map((connector) => (
                <ConnectorBlockCard key={connector.id} connector={connector} />
              ))}
            </CanvasLane>
          </div>

          <div className="wire-map">
            <div className="panel-heading">
              <h3>Wire Map</h3>
              <p>Visualized wire objects generated from the V1 connection form.</p>
            </div>
            {state.canvasDraft.wires.length > 0 ? (
              <div className="wire-list">
                {state.canvasDraft.wires.map((wire) => {
                  const fromNode = getCanvasNodeById(state.canvasDraft, wire.fromNodeId);
                  const toNode = getCanvasNodeById(state.canvasDraft, wire.toNodeId);

                  return (
                    <WireConnectionCard
                      key={wire.id}
                      wire={wire}
                      fromLabel={fromNode?.label ?? 'Unknown'}
                      toLabel={toNode?.label ?? 'Unknown'}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="canvas-lane__empty">
                Add wire connections to visualize the routing objects.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid--2">
        <article className="panel">
          <div className="panel-heading">
            <h3>Rule Feedback</h3>
            <p>These product rules define whether the current canvas can become an order draft.</p>
          </div>
          <div
            className={
              canvasEvaluation.canSubmit
                ? 'info-banner info-banner--success'
                : 'info-banner info-banner--error'
            }
          >
            {canvasEvaluation.headline}
          </div>
          {state.canvasDraft.lastFeedback ? (
            <p className="helper-copy">Last action: {state.canvasDraft.lastFeedback}</p>
          ) : null}
          <ul className="simple-list">
            {canvasEvaluation.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
            {canvasEvaluation.issues.length === 0 ? (
              <li>The canvas meets the minimum structure for V1 order submission.</li>
            ) : null}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>V1 Boundary And Exit</h3>
            <p>Canvas V1 is intentionally narrow. If your request no longer fits, move it into Upload / Assisted Request.</p>
          </div>
          <ul className="simple-list">
            <li>Supported connector families: {canvasV1Scope.connectorFamilies.join(', ')}.</li>
            <li>Supported mid elements: {canvasV1Scope.midElementTypes.join(', ')}.</li>
            <li>Supported wire types: {canvasV1Scope.wireTypes.join(', ')}.</li>
            <li>A connector only counts when it is configured and connected into the harness path.</li>
            <li>Only a clear left-to-right harness path is considered orderable in V1.</li>
          </ul>
          <div className="info-banner info-banner--subtle">
            {canvasV1Scope.summary}
          </div>
          <ul className="simple-list">
            {canvasEvaluation.assistedReviewReasons.length > 0 ? (
              canvasEvaluation.assistedReviewReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))
            ) : (
              <li>
                Need a connector family outside this subset, additional references, or a structure that does not fit the V1 path? Use Upload / Assisted Request.
              </li>
            )}
          </ul>
          <div className="action-row">
            <Link to="/upload" className="button">
              Upload References Instead
            </Link>
            <Link to="/upload" className="button button-secondary">
              Submit For Assisted Review
            </Link>
          </div>
        </article>
      </section>

      <QuoteSummaryBar
        readiness={canvasEvaluation.status}
        connectorCount={state.canvasDraft.connectors.length}
        midElementCount={state.canvasDraft.midElements.length}
        wireCount={state.canvasDraft.wires.length}
        quoteEstimate={canvasEvaluation.quoteEstimate}
        disabled={!canvasEvaluation.canSubmit}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
