import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CanvasLane } from '../components/canvas/CanvasLane';
import { ConnectorObjectCard } from '../components/canvas/ConnectorObjectCard';
import { MidElementObjectCard } from '../components/canvas/MidElementObjectCard';
import { QuoteSummaryBar } from '../components/canvas/QuoteSummaryBar';
import { useRequestSession } from '../context/RequestSessionContext';
import { usePrototype } from '../context/PrototypeContext';
import {
  awgOptions,
  canvasV1Scope,
  connectorFamilyCatalog,
  connectorPinOptions,
  midElementCatalog,
  wireColorOptions,
  wireTypeOptions,
} from '../data/canvasCatalog';
import { leadTimePreferenceOptions } from '../data/uploadDrafts';
import type {
  ConnectorZone,
  LeadTimePreference,
  WireConnectionInput,
} from '../types/prototype';
import { createCanvasRequest } from '../utils/requestApi';
import {
  buildCanvasAssumptions,
  buildCanvasKnownConnectors,
  buildCanvasKnownElements,
  buildCanvasKnownWires,
  buildCanvasMissingInfo,
  buildCanvasRequestSummary,
} from '../utils/requestTransforms';
import {
  getCanvasNodeById,
  getNodeTrack,
  isConnectorBlock,
  isMidElementBlock,
  validateWireConnection,
} from '../utils/prototypeBuilders';

type AddLane = 'left' | 'right' | 'column-1' | 'column-2' | 'column-3';
type PendingEndpoint = {
  nodeId: string;
  pin: string;
};
type ConnectorFilter = 'all' | 'sealed' | 'power' | 'compact' | 'industrial';
type WireRenderPath = {
  id: string;
  path: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  midX: number;
  midY: number;
  stroke: string;
};

const defaultPins = connectorPinOptions[1] ?? connectorPinOptions[0] ?? 4;
const defaultAwg = awgOptions[1] ?? awgOptions[0] ?? '20 AWG';
const midElementChoices = Object.entries(midElementCatalog) as Array<
  [
    keyof typeof midElementCatalog,
    (typeof midElementCatalog)[keyof typeof midElementCatalog],
  ]
>;
const connectorFilters: ConnectorFilter[] = [
  'all',
  'sealed',
  'power',
  'compact',
  'industrial',
];

function buildConfiguratorLeadTimeNote(preference: LeadTimePreference) {
  switch (preference) {
    case 'expedite':
      return 'Expedited lead time requested. Final timing is confirmed during payment and final handling.';
    case 'flexible':
      return 'Lead time remains flexible and will be aligned during final handling.';
    default:
      return 'Standard lead time has been selected for this structured order.';
  }
}

export function ConfiguratorCanvasPage() {
  const navigate = useNavigate();
  const { setActiveRequestId } = useRequestSession();
  const {
    addWire,
    allCanvasNodes,
    canvasEvaluation,
    createConnector,
    createMidElement,
    loadSampleValidCanvas,
    setCanvasFeedback,
    state,
    updateConnector,
    updateMidElement,
    updateWire,
  } = usePrototype();
  const [openAddLane, setOpenAddLane] = useState<AddLane | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectorLabel, setConnectorLabel] = useState('');
  const [connectorPins, setConnectorPins] = useState(defaultPins);
  const [connectorOptionsText, setConnectorOptionsText] = useState('');
  const [connectorAwg, setConnectorAwg] = useState(defaultAwg);
  const [connectorSearch, setConnectorSearch] = useState('');
  const [connectorFilter, setConnectorFilter] = useState<ConnectorFilter>('all');
  const [midElementLabel, setMidElementLabel] = useState('');
  const [pendingEndpoint, setPendingEndpoint] = useState<PendingEndpoint | null>(null);
  const [editingWireId, setEditingWireId] = useState<string | null>(null);
  const [pendingWireDraft, setPendingWireDraft] = useState<WireConnectionInput | null>(
    null,
  );
  const [isCanvasSubmitOpen, setIsCanvasSubmitOpen] = useState(false);
  const [canvasProjectName, setCanvasProjectName] = useState('');
  const [canvasRequestSummary, setCanvasRequestSummary] = useState('');
  const [canvasQuantity, setCanvasQuantity] = useState(1);
  const [canvasLeadTimePreference, setCanvasLeadTimePreference] =
    useState<LeadTimePreference>('standard');
  const [canvasIntendedUse, setCanvasIntendedUse] = useState('');
  const [canvasEnvironmentNotes, setCanvasEnvironmentNotes] = useState('');
  const [canvasValidationNotice, setCanvasValidationNotice] = useState<string | null>(
    null,
  );
  const [canvasSubmissionError, setCanvasSubmissionError] = useState<string | null>(
    null,
  );
  const [isSubmittingCanvasRequest, setIsSubmittingCanvasRequest] = useState(false);
  const [wireRenderPaths, setWireRenderPaths] = useState<WireRenderPath[]>([]);
  const canvasGridRef = useRef<HTMLDivElement | null>(null);
  const pinRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const selectedNode = selectedNodeId
    ? allCanvasNodes.find((node) => node.id === selectedNodeId) ?? null
    : null;
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

  useEffect(() => {
    if (!selectedNode) {
      return;
    }

    if (isConnectorBlock(selectedNode)) {
      setConnectorLabel(selectedNode.label);
      setConnectorPins(selectedNode.pins);
      setConnectorOptionsText(selectedNode.options.join(', '));
      setConnectorAwg(selectedNode.awg);
      return;
    }

    if (isMidElementBlock(selectedNode)) {
      setMidElementLabel(selectedNode.label);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (openAddLane === 'left' || openAddLane === 'right') {
      return;
    }

    setConnectorSearch('');
    setConnectorFilter('all');
  }, [openAddLane]);

  function toggleAddLane(lane: AddLane) {
    setOpenAddLane((currentLane) => (currentLane === lane ? null : lane));
  }

  function getOccupiedPins(nodeId: string) {
    return state.canvasDraft.wires.flatMap((wire) => {
      if (wire.fromNodeId === nodeId) {
        return [wire.fromPin];
      }

      if (wire.toNodeId === nodeId) {
        return [wire.toPin];
      }

      return [];
    });
  }

  function getActivePins(nodeId: string) {
    return Array.from(
      new Set(
        [
          pendingEndpoint?.nodeId === nodeId ? pendingEndpoint.pin : null,
          pendingWireDraft?.fromNodeId === nodeId ? pendingWireDraft.fromPin : null,
          pendingWireDraft?.toNodeId === nodeId ? pendingWireDraft.toPin : null,
        ].filter((pin): pin is string => Boolean(pin)),
      ),
    );
  }

  function getFilteredConnectorChoices() {
    const search = connectorSearch.trim().toLowerCase();

    return connectorFamilyCatalog.filter((item) => {
      const matchesFilter =
        connectorFilter === 'all' || item.tags.includes(connectorFilter);
      const matchesSearch =
        search.length === 0 ||
        item.label.toLowerCase().includes(search) ||
        item.detail.toLowerCase().includes(search) ||
        item.tags.some((tag) => tag.includes(search));

      return matchesFilter && matchesSearch;
    });
  }

  function closeConfiguratorModal() {
    setSelectedNodeId(null);
    setPendingWireDraft(null);
    setEditingWireId(null);
    setPendingEndpoint(null);
  }

  function registerPinRef(nodeId: string, pin: string, element: HTMLButtonElement | null) {
    pinRefs.current[`${nodeId}:${pin}`] = element;
  }

  function getWireStrokeColor(color: string) {
    switch (color.toLowerCase()) {
      case 'black':
        return '#101828';
      case 'red':
        return '#d92d20';
      case 'blue':
        return '#155eef';
      case 'green':
        return '#027a48';
      case 'yellow':
        return '#f79009';
      case 'white':
        return '#e4e7ec';
      case 'orange':
        return '#ef6820';
      case 'brown':
        return '#7a5030';
      case 'gray':
      case 'grey':
        return '#98a2b3';
      default:
        return '#155eef';
    }
  }

  function renderConnectorPicker(zone: ConnectorZone) {
    const filteredChoices = getFilteredConnectorChoices();

    return (
      <div className="canvas-picker-stack">
        <label className="field">
          <span>Find connector family</span>
          <input
            value={connectorSearch}
            onChange={(event) => setConnectorSearch(event.target.value)}
            placeholder="Search by family, use case, or tag"
          />
        </label>
        <div className="canvas-filter-row">
          {connectorFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`canvas-filter-chip${
                connectorFilter === filter ? ' is-active' : ''
              }`}
              onClick={() => setConnectorFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="canvas-picker-grid canvas-picker-grid--rich">
          {filteredChoices.map((family) => (
            <button
              key={family.label}
              type="button"
              className="canvas-picker-button"
              onClick={() => handleCreateConnector(zone, family.label)}
            >
              <strong>{family.label}</strong>
              <span>{family.detail}</span>
              <div className="tag-list">
                {family.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
        {filteredChoices.length === 0 ? (
          <p className="helper-copy">
            No connector families match that search. Try a broader search or
            continue with AI for a custom request.
          </p>
        ) : null}
      </div>
    );
  }

  function renderMidElementPicker(column: 1 | 2 | 3) {
    return (
      <div className="canvas-picker-grid">
        {midElementChoices.map(([type, item]) => (
          <button
            key={type}
            type="button"
            className="canvas-picker-button"
            onClick={() => handleCreateMidElement(column, type)}
          >
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </button>
        ))}
      </div>
    );
  }

  useEffect(() => {
    function updateWireRenderPaths() {
      const canvasGrid = canvasGridRef.current;

      if (!canvasGrid) {
        setWireRenderPaths([]);
        return;
      }

      const canvasGridRect = canvasGrid.getBoundingClientRect();
      const nextPaths = state.canvasDraft.wires.flatMap((wire) => {
        const fromPin = pinRefs.current[`${wire.fromNodeId}:${wire.fromPin}`];
        const toPin = pinRefs.current[`${wire.toNodeId}:${wire.toPin}`];

        if (!fromPin || !toPin) {
          return [];
        }

        const fromRect = fromPin.getBoundingClientRect();
        const toRect = toPin.getBoundingClientRect();
        const startX = fromRect.left + fromRect.width / 2 - canvasGridRect.left;
        const startY = fromRect.top + fromRect.height / 2 - canvasGridRect.top;
        const endX = toRect.left + toRect.width / 2 - canvasGridRect.left;
        const endY = toRect.top + toRect.height / 2 - canvasGridRect.top;
        const curveOffset = Math.max(98, Math.abs(endX - startX) * 0.46);
        const path = `M ${startX} ${startY} C ${startX + curveOffset} ${startY}, ${
          endX - curveOffset
        } ${endY}, ${endX} ${endY}`;
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        return [
          {
            id: wire.id,
            path,
            startX,
            startY,
            endX,
            endY,
            midX,
            midY,
            stroke: getWireStrokeColor(wire.wireColor),
          },
        ];
      });

      setWireRenderPaths(nextPaths);
    }

    const frame = requestAnimationFrame(updateWireRenderPaths);
    const handleResize = () => requestAnimationFrame(updateWireRenderPaths);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
    };
  }, [
    state.canvasDraft.connectors,
    state.canvasDraft.midElements,
    state.canvasDraft.wires,
    openAddLane,
  ]);

  function handleCreateConnector(zone: ConnectorZone, family: string) {
    const connectorId = createConnector({ zone, family });
    setSelectedNodeId(connectorId);
    setOpenAddLane(null);
    setPendingEndpoint(null);
    setPendingWireDraft(null);
  }

  function handleCreateMidElement(
    column: 1 | 2 | 3,
    type: keyof typeof midElementCatalog,
  ) {
    const midElementId = createMidElement({ column, type });
    setSelectedNodeId(midElementId);
    setOpenAddLane(null);
    setPendingEndpoint(null);
    setPendingWireDraft(null);
  }

  function handleSelectNode(nodeId: string) {
    setSelectedNodeId(nodeId);
    setOpenAddLane(null);
  }

  function handlePinClick(nodeId: string, pin: string) {
    setSelectedNodeId(nodeId);
    setOpenAddLane(null);
    setEditingWireId(null);

    const configurationBlockingMessage = getConfigurationBlockingMessage(nodeId);

    if (configurationBlockingMessage) {
      setCanvasFeedback(configurationBlockingMessage);
      return;
    }

    if (pendingWireDraft) {
      setPendingWireDraft(null);
    }

    if (!pendingEndpoint) {
      setPendingEndpoint({ nodeId, pin });
      return;
    }

    if (pendingEndpoint.nodeId === nodeId && pendingEndpoint.pin === pin) {
      setPendingEndpoint(null);
      return;
    }

    const firstNode = getCanvasNodeById(state.canvasDraft, pendingEndpoint.nodeId);
    const secondNode = getCanvasNodeById(state.canvasDraft, nodeId);

    if (!firstNode || !secondNode) {
      setPendingEndpoint(null);
      return;
    }

    let fromNodeId = pendingEndpoint.nodeId;
    let fromPin = pendingEndpoint.pin;
    let toNodeId = nodeId;
    let toPin = pin;

    if (getNodeTrack(firstNode) > getNodeTrack(secondNode)) {
      fromNodeId = nodeId;
      fromPin = pin;
      toNodeId = pendingEndpoint.nodeId;
      toPin = pendingEndpoint.pin;
    }

    const draftWire: WireConnectionInput = {
      fromNodeId,
      toNodeId,
      fromPin,
      toPin,
      length: 450,
      wireType: wireTypeOptions[0] ?? 'TXL',
      wireGauge: defaultAwg,
      wireColor: wireColorOptions[0] ?? 'Black',
    };

    const connectionValidation = validateWireConnection(state.canvasDraft, draftWire);

    if (connectionValidation) {
      setCanvasFeedback(connectionValidation);
      return;
    }

    setPendingWireDraft(draftWire);
    setPendingEndpoint(null);
  }

  function handleEditWire(wireId: string) {
    const existingWire = state.canvasDraft.wires.find((wire) => wire.id === wireId);

    if (!existingWire) {
      return;
    }

    setEditingWireId(existingWire.id);
    setSelectedNodeId(null);
    setOpenAddLane(null);
    setPendingEndpoint(null);
    setPendingWireDraft({
      fromNodeId: existingWire.fromNodeId,
      toNodeId: existingWire.toNodeId,
      fromPin: existingWire.fromPin,
      toPin: existingWire.toPin,
      length: existingWire.length,
      wireType: existingWire.wireType,
      wireGauge: existingWire.wireGauge,
      wireColor: existingWire.wireColor,
    });
  }

  function handleSaveConnector() {
    if (!selectedNode || !isConnectorBlock(selectedNode)) {
      return;
    }

    const options = connectorOptionsText
      .split(',')
      .map((option) => option.trim())
      .filter(Boolean);

    updateConnector(selectedNode.id, {
      label: connectorLabel,
      pins: connectorPins,
      options,
      awg: connectorAwg,
    });
    setSelectedNodeId(null);
  }

  function handleSaveMidElement() {
    if (!selectedNode || !isMidElementBlock(selectedNode)) {
      return;
    }

    updateMidElement(selectedNode.id, {
      label: midElementLabel,
    });
    setSelectedNodeId(null);
  }

  function handleSaveWire() {
    if (!pendingWireDraft) {
      return;
    }

    if (editingWireId) {
      updateWire(editingWireId, {
        length: pendingWireDraft.length,
        wireType: pendingWireDraft.wireType,
        wireGauge: pendingWireDraft.wireGauge,
        wireColor: pendingWireDraft.wireColor,
      });
      setPendingWireDraft(null);
      setPendingEndpoint(null);
      setEditingWireId(null);
      return;
    }

    const result = addWire(pendingWireDraft);

    if (result.ok) {
      setPendingWireDraft(null);
      setPendingEndpoint(null);
    }
  }

  function openCanvasSubmitModal() {
    if (!canvasEvaluation.canSubmit) {
      setCanvasValidationNotice(
        'Submission is on hold. Complete the missing structured items listed below before sending this request.',
      );
      setCanvasSubmissionError(null);
      return;
    }

    setCanvasRequestSummary((currentSummary) =>
      currentSummary || buildCanvasRequestSummary(state.canvasDraft),
    );
    setCanvasValidationNotice(null);
    setCanvasSubmissionError(null);
    setIsCanvasSubmitOpen(true);
  }

  function closeCanvasSubmitModal() {
    if (isSubmittingCanvasRequest) {
      return;
    }

    setCanvasSubmissionError(null);
    setIsCanvasSubmitOpen(false);
  }

  async function handleCreateCanvasRequest() {
    if (!canvasEvaluation.canSubmit) {
      setCanvasValidationNotice(
        'Submission is on hold. Complete the missing structured items listed below before sending this request.',
      );
      setCanvasSubmissionError(null);
      return;
    }

    if (canvasRequestFormValidation) {
      setCanvasValidationNotice(canvasRequestFormValidation);
      setCanvasSubmissionError(null);
      return;
    }

    setIsSubmittingCanvasRequest(true);
    setCanvasValidationNotice(null);
    setCanvasSubmissionError(null);

    try {
      const request = await createCanvasRequest({
        projectName: canvasProjectName,
        requestSummary:
          canvasRequestSummary.trim() || buildCanvasRequestSummary(state.canvasDraft),
        draftSummary:
          canvasRequestSummary.trim() || buildCanvasRequestSummary(state.canvasDraft),
        manufacturableNotes:
          'This configured harness stays inside the current structured boundary and is ready for direct order review.',
        quotePlaceholder: canvasEvaluation.quoteEstimate,
        leadTimeNote: buildConfiguratorLeadTimeNote(canvasLeadTimePreference),
        quantity: canvasQuantity,
        leadTimePreference: canvasLeadTimePreference,
        intendedUse: canvasIntendedUse,
        environmentNotes: canvasEnvironmentNotes,
        assumptions: [
          ...buildCanvasAssumptions(),
          ...canvasEvaluation.assistedReviewReasons,
        ],
        missingInfo: buildCanvasMissingInfo(),
        canvasSnapshot: state.canvasDraft,
        knownConnectors: buildCanvasKnownConnectors(state.canvasDraft),
        knownElements: buildCanvasKnownElements(state.canvasDraft),
        knownWires: buildCanvasKnownWires(state.canvasDraft),
        status: 'draft-ready',
      });
      setActiveRequestId(request.id);
      setIsCanvasSubmitOpen(false);
      navigate(`/review-order/${request.id}`);
    } catch (submitError) {
      const detail =
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save the request.';
      setCanvasSubmissionError(
        `We could not save the request. The current setup still remains ready for submission. ${detail}`,
      );
    } finally {
      setIsSubmittingCanvasRequest(false);
    }
  }

  function handleLoadSampleValidCanvas() {
    loadSampleValidCanvas();
    setCanvasValidationNotice(null);
    setCanvasSubmissionError(null);
    setIsCanvasSubmitOpen(false);
    setCanvasProjectName('Structured Harness Intake');
    setCanvasRequestSummary('');
    setCanvasQuantity(1);
    setCanvasLeadTimePreference('standard');
    setCanvasIntendedUse('Sample bench harness');
    setCanvasEnvironmentNotes('');
  }

  const pendingEndpointNode = pendingEndpoint
    ? getCanvasNodeById(state.canvasDraft, pendingEndpoint.nodeId)
    : null;
  const pendingWireFromNode = pendingWireDraft
    ? getCanvasNodeById(state.canvasDraft, pendingWireDraft.fromNodeId)
    : null;
  const pendingWireToNode = pendingWireDraft
    ? getCanvasNodeById(state.canvasDraft, pendingWireDraft.toNodeId)
    : null;
  const isEditingWire = editingWireId !== null;
  const canvasRequestFormValidation =
    !canvasProjectName.trim()
      ? 'Add a project name before creating the request.'
      : canvasQuantity < 1
        ? 'Quantity must be at least 1 before creating the request.'
        : null;
  const canvasValidationReasons = canvasEvaluation.validationReasons;

  function getConfigurationBlockingMessage(nodeId: string) {
    const node = getCanvasNodeById(state.canvasDraft, nodeId);

    if (!node || node.configurationState === 'configured') {
      return null;
    }

    if (isConnectorBlock(node)) {
      return `Incomplete connector configuration: ${node.label} still needs details. ${node.missingFields.join(' ')}`;
    }

    return `Disconnected element: ${node.label} still needs details before it can be connected into a valid harness path. ${node.missingFields.join(' ')}`;
  }

  return (
    <div className="page-stack">
      <section className="canvas-toolbar">
        <div className="canvas-toolbar__copy">
          <span className="eyebrow">Canvas path</span>
          <strong>Structured harness workspace</strong>
          <p>Prepare one structured left-to-right harness path here.</p>
        </div>
        <div className="canvas-toolbar__actions">
          <span
            className={
              canvasEvaluation.canSubmit
                ? 'status-chip status-chip--success'
                : 'status-chip'
            }
          >
            {canvasEvaluation.status}
          </span>
          {!canvasEvaluation.canSubmit ? (
            <>
              <Link to="/ai-agent" className="button button-secondary">
                Continue with AI
              </Link>
              <Link to="/upload" className="button button-ghost">
                Use Upload Intake
              </Link>
            </>
          ) : null}
        </div>
      </section>

      <section className="canvas-stage">
        <div className="canvas-stage__top">
          <div className="canvas-stage__lead">
            <span className="eyebrow">Workspace</span>
            <h3>Canvas workspace</h3>
            <p>Add connectors and elements inside the workspace, refine details only when needed, and connect pins to define the harness path.</p>
          </div>
          <div className="canvas-stage__hint">
            {pendingEndpoint && pendingEndpointNode ? (
              <span>
                Connecting from {pendingEndpointNode.label}:{pendingEndpoint.pin}
              </span>
            ) : state.canvasDraft.lastFeedback ? (
              <span>{state.canvasDraft.lastFeedback}</span>
            ) : (
              <span>
                Start with a source connector and a load connector, then add wires to complete the path. Occupied pins remain unavailable.
              </span>
            )}
          </div>
        </div>

        <div className="canvas-grid-shell" ref={canvasGridRef}>
          {wireRenderPaths.length > 0 ? (
            <svg className="canvas-wire-overlay" aria-label="Harness routing preview">
              {wireRenderPaths.map((wirePath) => (
                <g
                  key={wirePath.id}
                  className={`canvas-wire-overlay__group${
                    editingWireId === wirePath.id ? ' is-active' : ''
                  }`}
                >
                  <path className="canvas-wire-overlay__shadow" d={wirePath.path} />
                  <path
                    className="canvas-wire-overlay__hit"
                    d={wirePath.path}
                    onClick={() => handleEditWire(wirePath.id)}
                  />
                  <path
                    className="canvas-wire-overlay__path"
                    d={wirePath.path}
                    style={{ stroke: wirePath.stroke }}
                  />
                  <circle
                    className="canvas-wire-overlay__node"
                    cx={wirePath.startX}
                    cy={wirePath.startY}
                    r="4"
                  />
                  <circle
                    className="canvas-wire-overlay__node"
                    cx={wirePath.endX}
                    cy={wirePath.endY}
                    r="4"
                  />
                  <circle
                    className="canvas-wire-overlay__handle-ring"
                    cx={wirePath.midX}
                    cy={wirePath.midY}
                    r="9"
                    onClick={() => handleEditWire(wirePath.id)}
                  />
                  <circle
                    className="canvas-wire-overlay__handle"
                    cx={wirePath.midX}
                    cy={wirePath.midY}
                    r="5"
                    onClick={() => handleEditWire(wirePath.id)}
                  />
                </g>
              ))}
            </svg>
          ) : null}
          <div className="canvas-grid">
            <CanvasLane
              title="Source"
              subtitle="Left connector zone"
              emptyMessage="No left connectors yet."
              addLabel="Add left connector"
              onAddClick={() => toggleAddLane('left')}
              addPanel={openAddLane === 'left' ? renderConnectorPicker('left') : null}
            >
              {leftConnectors.map((connector) => (
                <ConnectorObjectCard
                  key={connector.id}
                  connector={connector}
                  isSelected={selectedNodeId === connector.id}
                  onSelect={() => handleSelectNode(connector.id)}
                  onPinClick={(pin) => handlePinClick(connector.id, pin)}
                  registerPinRef={(pin, element) =>
                    registerPinRef(connector.id, pin, element)
                  }
                  activePins={getActivePins(connector.id)}
                  occupiedPins={getOccupiedPins(connector.id)}
                />
              ))}
            </CanvasLane>

            <CanvasLane
              title="Column 1"
              subtitle="Structured slot"
              emptyMessage="Column 1 is empty."
              addLabel="Add element"
              onAddClick={() => toggleAddLane('column-1')}
              addPanel={openAddLane === 'column-1' ? renderMidElementPicker(1) : null}
            >
              {columnOne.map((midElement) => (
                <MidElementObjectCard
                  key={midElement.id}
                  midElement={midElement}
                  isSelected={selectedNodeId === midElement.id}
                  onSelect={() => handleSelectNode(midElement.id)}
                  onPinClick={(pin) => handlePinClick(midElement.id, pin)}
                  registerPinRef={(pin, element) =>
                    registerPinRef(midElement.id, pin, element)
                  }
                  activePins={getActivePins(midElement.id)}
                  occupiedPins={getOccupiedPins(midElement.id)}
                />
              ))}
            </CanvasLane>

            <CanvasLane
              title="Column 2"
              subtitle="Structured slot"
              emptyMessage="Column 2 is empty."
              addLabel="Add element"
              onAddClick={() => toggleAddLane('column-2')}
              addPanel={openAddLane === 'column-2' ? renderMidElementPicker(2) : null}
            >
              {columnTwo.map((midElement) => (
                <MidElementObjectCard
                  key={midElement.id}
                  midElement={midElement}
                  isSelected={selectedNodeId === midElement.id}
                  onSelect={() => handleSelectNode(midElement.id)}
                  onPinClick={(pin) => handlePinClick(midElement.id, pin)}
                  registerPinRef={(pin, element) =>
                    registerPinRef(midElement.id, pin, element)
                  }
                  activePins={getActivePins(midElement.id)}
                  occupiedPins={getOccupiedPins(midElement.id)}
                />
              ))}
            </CanvasLane>

            <CanvasLane
              title="Column 3"
              subtitle="Structured slot"
              emptyMessage="Column 3 is empty."
              addLabel="Add element"
              onAddClick={() => toggleAddLane('column-3')}
              addPanel={openAddLane === 'column-3' ? renderMidElementPicker(3) : null}
            >
              {columnThree.map((midElement) => (
                <MidElementObjectCard
                  key={midElement.id}
                  midElement={midElement}
                  isSelected={selectedNodeId === midElement.id}
                  onSelect={() => handleSelectNode(midElement.id)}
                  onPinClick={(pin) => handlePinClick(midElement.id, pin)}
                  registerPinRef={(pin, element) =>
                    registerPinRef(midElement.id, pin, element)
                  }
                  activePins={getActivePins(midElement.id)}
                  occupiedPins={getOccupiedPins(midElement.id)}
                />
              ))}
            </CanvasLane>

            <CanvasLane
              title="Load"
              subtitle="Right connector zone"
              emptyMessage="No right connectors yet."
              addLabel="Add right connector"
              onAddClick={() => toggleAddLane('right')}
              addPanel={openAddLane === 'right' ? renderConnectorPicker('right') : null}
            >
              {rightConnectors.map((connector) => (
                <ConnectorObjectCard
                  key={connector.id}
                  connector={connector}
                  isSelected={selectedNodeId === connector.id}
                  onSelect={() => handleSelectNode(connector.id)}
                  onPinClick={(pin) => handlePinClick(connector.id, pin)}
                  registerPinRef={(pin, element) =>
                    registerPinRef(connector.id, pin, element)
                  }
                  activePins={getActivePins(connector.id)}
                  occupiedPins={getOccupiedPins(connector.id)}
                />
              ))}
            </CanvasLane>
          </div>
        </div>
      </section>

      <section className="canvas-status-strip">
        <span
          className={
            canvasEvaluation.canSubmit
              ? 'status-chip status-chip--success'
              : 'status-chip'
          }
        >
          {canvasEvaluation.headline}
        </span>
        {state.canvasDraft.lastFeedback ? (
          <p className="helper-copy">Last action: {state.canvasDraft.lastFeedback}</p>
        ) : null}
        {canvasEvaluation.canSubmit ? (
          <div className="info-banner info-banner--subtle">
            This setup is ready for order placement inside the current structured boundary. Review the order to continue.
          </div>
        ) : null}
        {!canvasEvaluation.canSubmit ? (
          <div className="info-banner info-banner--subtle">
            <strong>Complete the following items before submission:</strong>
            <ul className="simple-list validation-reason-list">
              {canvasValidationReasons.map((reason) => (
                <li key={`${reason.code}-${reason.detail}`}>
                  <strong>{reason.title}:</strong> {reason.detail}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {canvasValidationNotice ? (
          <div className="info-banner info-banner--subtle">{canvasValidationNotice}</div>
        ) : null}
        {canvasSubmissionError ? (
          <div className="info-banner info-banner--error">{canvasSubmissionError}</div>
        ) : null}
        <details className="canvas-details">
          <summary>Canvas coverage</summary>
          <ul className="simple-list">
            {canvasValidationReasons.map((reason) => (
              <li key={`${reason.code}-${reason.detail}`}>
                <strong>{reason.title}:</strong> {reason.detail}
              </li>
            ))}
            {canvasValidationReasons.length === 0 ? (
              <li>The current structure fits the canvas boundary.</li>
            ) : null}
            {canvasEvaluation.assistedReviewReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
            <li>Visible connector families: {canvasV1Scope.connectorFamilies.length}.</li>
            <li>Supported mid elements: {canvasV1Scope.midElementTypes.join(', ')}.</li>
            <li>Supported wire types: {canvasV1Scope.wireTypes.join(', ')}.</li>
          </ul>
        </details>
      </section>

      <QuoteSummaryBar
        readiness={canvasEvaluation.status}
        connectorCount={state.canvasDraft.connectors.length}
        midElementCount={state.canvasDraft.midElements.length}
        wireCount={state.canvasDraft.wires.length}
        quoteEstimate={canvasEvaluation.quoteEstimate}
        disabled={!canvasEvaluation.canSubmit}
        submitLabel="Review Order"
        onSubmit={openCanvasSubmitModal}
      />

      {isCanvasSubmitOpen ? (
        <div className="canvas-modal-backdrop" onClick={closeCanvasSubmitModal}>
          <div className="canvas-modal" onClick={(event) => event.stopPropagation()}>
            <div className="canvas-modal__header">
              <div className="canvas-modal__copy">
                <span className="eyebrow">Save request</span>
                <h3>Save and continue to order review</h3>
                <p>Enter the required request details, save the structured order, and continue.</p>
              </div>
              <button
                type="button"
                className="button button-ghost"
                onClick={closeCanvasSubmitModal}
              >
                Close
              </button>
            </div>
            <div className="wire-draft-meta">
              <strong>
                {state.canvasDraft.connectors.length} connectors,{' '}
                {state.canvasDraft.midElements.length} elements,{' '}
                {state.canvasDraft.wires.length} wires
              </strong>
              <span>Ready for order review</span>
            </div>
            <div className="field-row">
              <label className="field">
                <span>Project name</span>
                <input
                  value={canvasProjectName}
                  onChange={(event) => setCanvasProjectName(event.target.value)}
                  placeholder="Example: EH Structured Harness Request"
                />
              </label>
              <label className="field">
                <span>Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={canvasQuantity}
                  onChange={(event) => setCanvasQuantity(Number(event.target.value))}
                />
              </label>
            </div>
            <div className="field-row">
              <label className="field">
                <span>Lead time preference</span>
                <select
                  value={canvasLeadTimePreference}
                  onChange={(event) =>
                    setCanvasLeadTimePreference(
                      event.target.value as LeadTimePreference,
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
              <label className="field">
                <span>Intended use</span>
                <input
                  value={canvasIntendedUse}
                  onChange={(event) => setCanvasIntendedUse(event.target.value)}
                  placeholder="Test bench, sensor loom, field harness"
                />
              </label>
            </div>
            <label className="field">
              <span>Request summary</span>
              <textarea
                value={canvasRequestSummary}
                onChange={(event) => setCanvasRequestSummary(event.target.value)}
                placeholder={buildCanvasRequestSummary(state.canvasDraft)}
              />
            </label>
            <label className="field">
              <span>Environment notes</span>
              <textarea
                value={canvasEnvironmentNotes}
                onChange={(event) => setCanvasEnvironmentNotes(event.target.value)}
                placeholder="Operating environment, installation notes, or constraints."
              />
            </label>
            {canvasSubmissionError ? (
              <div className="info-banner info-banner--error">
                {canvasSubmissionError}
              </div>
            ) : canvasRequestFormValidation ? (
              <div className="info-banner info-banner--subtle">
                {canvasRequestFormValidation}
              </div>
            ) : (
              <div className="info-banner info-banner--subtle">
                Save the structured request to continue to the order review step.
              </div>
            )}
            <div className="canvas-modal__actions">
              <button
                type="button"
                className="button"
                disabled={
                  isSubmittingCanvasRequest || Boolean(canvasRequestFormValidation)
                }
                onClick={handleCreateCanvasRequest}
              >
                {isSubmittingCanvasRequest
                  ? 'Submitting request...'
                  : 'Save and Review Order'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingWireDraft ? (
        <div className="canvas-modal-backdrop" onClick={closeConfiguratorModal}>
          <div className="canvas-modal" onClick={(event) => event.stopPropagation()}>
            <div className="canvas-modal__header">
              <div className="canvas-modal__copy">
                <span className="eyebrow">Wire</span>
                <h3>{isEditingWire ? 'Refine wire' : 'Configure wire draft'}</h3>
                <p>Endpoints are already selected. Add the remaining wire details here, or continue with AI if routing needs broader interpretation.</p>
              </div>
              <button
                type="button"
                className="button button-ghost"
                onClick={closeConfiguratorModal}
              >
                Close
              </button>
            </div>
            <div className="wire-draft-meta">
              <strong>
                {pendingWireFromNode?.label ?? 'Unknown'}:{pendingWireDraft.fromPin}
              </strong>
              <span>
                to {pendingWireToNode?.label ?? 'Unknown'}:{pendingWireDraft.toPin}
              </span>
            </div>
            <div className="field-row">
              <label className="field">
                <span>Length (mm)</span>
                <input
                  type="number"
                  min="1"
                  value={pendingWireDraft.length}
                  onChange={(event) =>
                    setPendingWireDraft((currentDraft) =>
                      currentDraft
                        ? {
                            ...currentDraft,
                            length: Number(event.target.value),
                          }
                        : currentDraft,
                    )
                  }
                />
              </label>
              <label className="field">
                <span>Wire type</span>
                <select
                  value={pendingWireDraft.wireType}
                  onChange={(event) =>
                    setPendingWireDraft((currentDraft) =>
                      currentDraft
                        ? {
                            ...currentDraft,
                            wireType: event.target.value,
                          }
                        : currentDraft,
                    )
                  }
                >
                  {wireTypeOptions.map((wireType) => (
                    <option key={wireType} value={wireType}>
                      {wireType}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="field-row">
              <label className="field">
                <span>Gauge</span>
                <select
                  value={pendingWireDraft.wireGauge}
                  onChange={(event) =>
                    setPendingWireDraft((currentDraft) =>
                      currentDraft
                        ? {
                            ...currentDraft,
                            wireGauge: event.target.value,
                          }
                        : currentDraft,
                    )
                  }
                >
                  {awgOptions.map((awg) => (
                    <option key={awg} value={awg}>
                      {awg}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Color</span>
                <select
                  value={pendingWireDraft.wireColor}
                  onChange={(event) =>
                    setPendingWireDraft((currentDraft) =>
                      currentDraft
                        ? {
                            ...currentDraft,
                            wireColor: event.target.value,
                          }
                        : currentDraft,
                    )
                  }
                >
                  {wireColorOptions.map((wireColor) => (
                    <option key={wireColor} value={wireColor}>
                      {wireColor}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="canvas-modal__actions">
              <button type="button" className="button" onClick={handleSaveWire}>
                {isEditingWire ? 'Save Wire' : 'Add Connection'}
              </button>
              <Link to="/ai-agent" className="button button-secondary">
                Finish This With AI
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {selectedNode && !pendingWireDraft ? (
        <div className="canvas-modal-backdrop" onClick={closeConfiguratorModal}>
          <div className="canvas-modal" onClick={(event) => event.stopPropagation()}>
            {isConnectorBlock(selectedNode) ? (
              <>
                <div className="canvas-modal__header">
                  <div className="canvas-modal__copy">
                    <span className="eyebrow">Connector</span>
                    <h3>Refine connector</h3>
                    <p>The object is already placed in the workspace. Adjust only the details needed for this draft boundary.</p>
                  </div>
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={closeConfiguratorModal}
                  >
                    Close
                  </button>
                </div>
                <div className="field-row">
                  <label className="field">
                    <span>Label</span>
                    <input
                      value={connectorLabel}
                      onChange={(event) => setConnectorLabel(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Pins</span>
                    <select
                      value={connectorPins}
                      onChange={(event) => setConnectorPins(Number(event.target.value))}
                    >
                      {connectorPinOptions.map((pinCount) => (
                        <option key={pinCount} value={pinCount}>
                          {pinCount}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="field-row">
                  <label className="field">
                    <span>AWG</span>
                    <select
                      value={connectorAwg}
                      onChange={(event) => setConnectorAwg(event.target.value)}
                    >
                      {awgOptions.map((awg) => (
                        <option key={awg} value={awg}>
                          {awg}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Zone</span>
                    <input value={selectedNode.zone} disabled />
                  </label>
                </div>
                <label className="field">
                  <span>Connector options</span>
                  <input
                    value={connectorOptionsText}
                    onChange={(event) => setConnectorOptionsText(event.target.value)}
                    placeholder="sealed, keyed, strain relief"
                  />
                </label>
                {selectedNode.missingFields.length > 0 ? (
                  <div className="info-banner info-banner--error">
                    {selectedNode.missingFields.join(' ')}
                  </div>
                ) : null}
                <div className="canvas-modal__actions">
                  <button type="button" className="button" onClick={handleSaveConnector}>
                    Save Connector
                  </button>
                  <Link to="/ai-agent" className="button button-secondary">
                    Let AI Continue
                  </Link>
                </div>
              </>
            ) : null}

            {isMidElementBlock(selectedNode) ? (
              <>
                <div className="canvas-modal__header">
                  <div className="canvas-modal__copy">
                    <span className="eyebrow">Mid element</span>
                    <h3>Refine element</h3>
                    <p>Place the object first, then return here only when you need to adjust its identifying details.</p>
                  </div>
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={closeConfiguratorModal}
                  >
                    Close
                  </button>
                </div>
                <div className="field-row">
                  <label className="field">
                    <span>Label</span>
                    <input
                      value={midElementLabel}
                      onChange={(event) => setMidElementLabel(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Column</span>
                    <input value={String(selectedNode.column)} disabled />
                  </label>
                </div>
                <div className="field-row">
                  <label className="field">
                    <span>Type</span>
                    <input value={midElementCatalog[selectedNode.type].label} disabled />
                  </label>
                  <label className="field">
                    <span>Ports</span>
                    <input value={selectedNode.ports.join(', ')} disabled />
                  </label>
                </div>
                {selectedNode.missingFields.length > 0 ? (
                  <div className="info-banner info-banner--error">
                    {selectedNode.missingFields.join(' ')}
                  </div>
                ) : null}
                <div className="canvas-modal__actions">
                  <button type="button" className="button" onClick={handleSaveMidElement}>
                    Save Mid Element
                  </button>
                  <Link to="/ai-agent" className="button button-secondary">
                    Let AI Continue
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
