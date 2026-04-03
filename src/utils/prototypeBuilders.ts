import { midElementCatalog } from '../data/canvasCatalog';
import { processingTemplates, sourceTypeLabels } from '../data/mockOrderDrafts';
import type {
  CanvasDraft,
  CanvasNode,
  CanvasReadiness,
  ConnectorBlock,
  FlowSource,
  LeadTimePreference,
  MidElementBlock,
  OrderDraft,
  ProcessingInfo,
  UploadDraft,
  WireConnectionInput,
} from '../types/prototype';

type CanvasComponent = {
  nodeIds: string[];
  hasConfiguredLeft: boolean;
  hasConfiguredRight: boolean;
};

export type CanvasValidationReason = {
  code:
    | 'missing-left-connector'
    | 'missing-right-connector'
    | 'incomplete-connector-configuration'
    | 'disconnected-element'
    | 'invalid-path'
    | 'occupied-pin'
    | 'unsupported-structure';
  title: string;
  detail: string;
};

export type CanvasEvaluation = {
  status: CanvasReadiness;
  headline: string;
  validationReasons: CanvasValidationReason[];
  issues: string[];
  assistedReviewReasons: string[];
  canSubmit: boolean;
  quoteEstimate: string;
};

export function createEntityId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function createSampleValidCanvasDraft(): CanvasDraft {
  const leftConnectorId = createEntityId('connector');
  const midElementId = createEntityId('mid');
  const rightConnectorId = createEntityId('connector');

  return {
    connectors: [
      {
        kind: 'connector',
        id: leftConnectorId,
        label: 'Left Deutsch DT 1',
        family: 'Deutsch DT',
        pins: 4,
        options: ['sealed'],
        awg: '20 AWG',
        zone: 'left',
        configurationState: 'configured',
        missingFields: [],
      },
      {
        kind: 'connector',
        id: rightConnectorId,
        label: 'Right M12 Circular 1',
        family: 'M12 Circular',
        pins: 4,
        options: ['sensor side'],
        awg: '20 AWG',
        zone: 'right',
        configurationState: 'configured',
        missingFields: [],
      },
    ],
    midElements: [
      {
        kind: 'mid-element',
        id: midElementId,
        label: 'Cable 1',
        type: 'cable',
        column: 2,
        detail: midElementCatalog.cable.detail,
        ports: midElementCatalog.cable.ports,
        configurationState: 'configured',
        missingFields: [],
      },
    ],
    wires: [
      {
        id: createEntityId('wire'),
        fromNodeId: leftConnectorId,
        toNodeId: midElementId,
        fromPin: 'P1',
        toPin: 'IN',
        length: 320,
        wireType: 'TXL',
        wireGauge: '20 AWG',
        wireColor: 'Black',
      },
      {
        id: createEntityId('wire'),
        fromNodeId: midElementId,
        toNodeId: rightConnectorId,
        fromPin: 'OUT',
        toPin: 'P1',
        length: 280,
        wireType: 'TXL',
        wireGauge: '20 AWG',
        wireColor: 'Blue',
      },
    ],
    lastFeedback: 'Loaded sample canvas.',
  };
}

export function isConnectorBlock(node: CanvasNode): node is ConnectorBlock {
  return node.kind === 'connector';
}

export function isMidElementBlock(node: CanvasNode): node is MidElementBlock {
  return node.kind === 'mid-element';
}

export function isNodeConfigured(node: CanvasNode) {
  return node.configurationState === 'configured';
}

export function getCanvasNodeById(draft: CanvasDraft, nodeId: string) {
  return [...draft.connectors, ...draft.midElements].find(
    (node) => node.id === nodeId,
  );
}

export function getNodeConnectionPoints(node: CanvasNode) {
  if (isConnectorBlock(node)) {
    return Array.from({ length: node.pins }, (_, index) => `P${index + 1}`);
  }

  return node.ports;
}

export function getNodeTrack(node: CanvasNode) {
  if (isConnectorBlock(node)) {
    return node.zone === 'left' ? 0 : 4;
  }

  return node.column;
}

export function getConnectorMissingFields(input: {
  label: string;
  options: string[];
}) {
  const missingFields: string[] = [];

  if (!input.label.trim()) {
    missingFields.push('Add a connector label or reference ID.');
  }

  if (input.options.length === 0) {
    missingFields.push('Specify at least one connector option.');
  }

  return missingFields;
}

export function getMidElementMissingFields(input: { label: string }) {
  const missingFields: string[] = [];

  if (!input.label.trim()) {
    missingFields.push('Add a mid element label before submission.');
  }

  return missingFields;
}

function endpointKey(nodeId: string, pin: string) {
  return `${nodeId}:${pin}`;
}

function addValidationReason(
  reasons: CanvasValidationReason[],
  reason: CanvasValidationReason,
) {
  if (
    reasons.some(
      (existingReason) =>
        existingReason.code === reason.code &&
        existingReason.detail === reason.detail,
    )
  ) {
    return;
  }

  reasons.push(reason);
}

function formatValidationReason(reason: CanvasValidationReason) {
  return `${reason.title}: ${reason.detail}`;
}

function getAllNodes(draft: CanvasDraft) {
  return [...draft.connectors, ...draft.midElements];
}

function createAdjacencyMap(draft: CanvasDraft) {
  const adjacency = new Map<string, string[]>();

  for (const node of getAllNodes(draft)) {
    adjacency.set(node.id, []);
  }

  for (const wire of draft.wires) {
    adjacency.set(wire.fromNodeId, [
      ...(adjacency.get(wire.fromNodeId) ?? []),
      wire.toNodeId,
    ]);
    adjacency.set(wire.toNodeId, [
      ...(adjacency.get(wire.toNodeId) ?? []),
      wire.fromNodeId,
    ]);
  }

  return adjacency;
}

function getCanvasComponents(draft: CanvasDraft) {
  const adjacency = createAdjacencyMap(draft);
  const nodesById = new Map(getAllNodes(draft).map((node) => [node.id, node]));
  const seen = new Set<string>();
  const components: CanvasComponent[] = [];

  for (const node of getAllNodes(draft)) {
    if (seen.has(node.id)) {
      continue;
    }

    const nodeIds: string[] = [];
    const stack = [node.id];
    let hasConfiguredLeft = false;
    let hasConfiguredRight = false;

    while (stack.length > 0) {
      const currentId = stack.pop();

      if (!currentId || seen.has(currentId)) {
        continue;
      }

      seen.add(currentId);
      nodeIds.push(currentId);

      const currentNode = nodesById.get(currentId);

      if (
        currentNode &&
        isConnectorBlock(currentNode) &&
        currentNode.configurationState === 'configured'
      ) {
        if (currentNode.zone === 'left') {
          hasConfiguredLeft = true;
        }

        if (currentNode.zone === 'right') {
          hasConfiguredRight = true;
        }
      }

      for (const neighbor of adjacency.get(currentId) ?? []) {
        stack.push(neighbor);
      }
    }

    components.push({
      nodeIds,
      hasConfiguredLeft,
      hasConfiguredRight,
    });
  }

  return {
    adjacency,
    components,
  };
}

function getValidHarnessNodeIds(draft: CanvasDraft) {
  const { components } = getCanvasComponents(draft);
  const validNodeIds = new Set<string>();

  for (const component of components) {
    if (component.hasConfiguredLeft && component.hasConfiguredRight) {
      for (const nodeId of component.nodeIds) {
        validNodeIds.add(nodeId);
      }
    }
  }

  return validNodeIds;
}

function hasConfiguredLeftToRightPath(draft: CanvasDraft) {
  const validNodeIds = getValidHarnessNodeIds(draft);
  return validNodeIds.size > 0;
}

function buildQuoteEstimate(draft: CanvasDraft) {
  const basePrice = 950;
  const connectorPrice = draft.connectors.length * 140;
  const midElementPrice = draft.midElements.length * 95;
  const wirePrice = draft.wires.length * 42;
  const total = basePrice + connectorPrice + midElementPrice + wirePrice;

  return `$${total.toLocaleString()} placeholder`;
}

export function validateWireConnection(
  draft: CanvasDraft,
  input: WireConnectionInput,
) {
  const fromNode = getCanvasNodeById(draft, input.fromNodeId);
  const toNode = getCanvasNodeById(draft, input.toNodeId);

  if (!fromNode || !toNode) {
    return 'Choose both a source block and a target block before adding this wire.';
  }

  if (input.fromNodeId === input.toNodeId) {
    return 'This wire cannot start and end on the same block. Pick a different source or target.';
  }

  if (input.length <= 0) {
    return 'Wire length is missing. Enter a positive length before adding this connection.';
  }

  const fromTrack = getNodeTrack(fromNode);
  const toTrack = getNodeTrack(toNode);

  if (fromTrack === toTrack) {
    return 'Invalid path: this connection does not move the harness path forward. The canvas expects connections to advance from the left side toward the right side.';
  }

  if (fromTrack > toTrack) {
    return 'Invalid path: this connection runs backward. The canvas only supports left-to-right harness paths.';
  }

  const fromPoints = getNodeConnectionPoints(fromNode);
  const toPoints = getNodeConnectionPoints(toNode);

  if (!fromPoints.includes(input.fromPin)) {
    return `The source point ${input.fromPin} is not available on ${fromNode.label}.`;
  }

  if (!toPoints.includes(input.toPin)) {
    return `The target point ${input.toPin} is not available on ${toNode.label}.`;
  }

  const occupiedEndpoints = new Set(
    draft.wires.flatMap((wire) => [
      endpointKey(wire.fromNodeId, wire.fromPin),
      endpointKey(wire.toNodeId, wire.toPin),
    ]),
  );

  if (occupiedEndpoints.has(endpointKey(input.fromNodeId, input.fromPin))) {
    return `Occupied pin: the source point ${input.fromPin} on ${fromNode.label} is already committed to another wire.`;
  }

  if (occupiedEndpoints.has(endpointKey(input.toNodeId, input.toPin))) {
    return `Occupied pin: the target point ${input.toPin} on ${toNode.label} is already committed to another wire.`;
  }

  const duplicateConnection = draft.wires.some(
    (wire) =>
      wire.fromNodeId === input.fromNodeId &&
      wire.toNodeId === input.toNodeId &&
      wire.fromPin === input.fromPin &&
      wire.toPin === input.toPin,
  );

  if (duplicateConnection) {
    return 'This exact wire connection is already included in the draft.';
  }

  return null;
}

export function evaluateCanvasDraft(draft: CanvasDraft): CanvasEvaluation {
  const totalBlocks = draft.connectors.length + draft.midElements.length;
  const { adjacency, components } = getCanvasComponents(draft);
  const validNodeIds = getValidHarnessNodeIds(draft);
  const validationReasons: CanvasValidationReason[] = [];
  const assistedReviewReasons: string[] = [];
  const validComponents = components.filter(
    (component) => component.hasConfiguredLeft && component.hasConfiguredRight,
  );

  if (totalBlocks === 0 && draft.wires.length === 0) {
    addValidationReason(validationReasons, {
      code: 'missing-left-connector',
      title: 'Missing left connector',
      detail: 'Add a configured connector in the left zone to begin a structured harness path.',
    });
    addValidationReason(validationReasons, {
      code: 'missing-right-connector',
      title: 'Missing right connector',
      detail: 'Add a configured connector in the right zone so the harness has a destination.',
    });
    addValidationReason(validationReasons, {
      code: 'invalid-path',
      title: 'Invalid path',
      detail: 'Add wires that create one complete left-to-right harness path before submitting.',
    });

    return {
      status: 'empty',
      headline:
        'Add the required connectors, elements, and wire path before submission.',
      validationReasons,
      issues: validationReasons.map(formatValidationReason),
      assistedReviewReasons: [
        'Continue with AI Agent or Upload Intake if the request already depends on reference files or exceeds the current canvas boundary.',
      ],
      canSubmit: false,
      quoteEstimate: buildQuoteEstimate(draft),
    };
  }

  const configuredLeftConnectors = draft.connectors.filter(
    (connector) =>
      connector.zone === 'left' &&
      connector.configurationState === 'configured' &&
      (adjacency.get(connector.id)?.length ?? 0) > 0,
  );
  const configuredRightConnectors = draft.connectors.filter(
    (connector) =>
      connector.zone === 'right' &&
      connector.configurationState === 'configured' &&
      (adjacency.get(connector.id)?.length ?? 0) > 0,
  );

  if (configuredLeftConnectors.length === 0) {
    addValidationReason(validationReasons, {
      code: 'missing-left-connector',
      title: 'Missing left connector',
      detail: 'Add at least one configured left connector and connect it into the harness path.',
    });
  }

  if (configuredRightConnectors.length === 0) {
    addValidationReason(validationReasons, {
      code: 'missing-right-connector',
      title: 'Missing right connector',
      detail: 'Add at least one configured right connector and connect it into the harness path.',
    });
  }

  for (const connector of draft.connectors) {
    if (connector.configurationState === 'incomplete') {
      addValidationReason(validationReasons, {
        code: 'incomplete-connector-configuration',
        title: 'Incomplete connector configuration',
        detail: `${connector.label} still needs details. ${connector.missingFields.join(' ')}`,
      });
      continue;
    }

    const connectionCount = adjacency.get(connector.id)?.length ?? 0;

    if (connectionCount === 0) {
      addValidationReason(validationReasons, {
        code: 'invalid-path',
        title: 'Invalid path',
        detail: `${connector.label} is not connected into the harness path yet.`,
      });
      continue;
    }

    if (!validNodeIds.has(connector.id)) {
      addValidationReason(validationReasons, {
        code: 'invalid-path',
        title: 'Invalid path',
        detail: `${connector.label} is not part of one complete left-to-right harness path yet.`,
      });
    }
  }

  for (const midElement of draft.midElements) {
    if (midElement.configurationState === 'incomplete') {
      addValidationReason(validationReasons, {
        code: 'disconnected-element',
        title: 'Disconnected element',
        detail: `${midElement.label} still needs details before it can sit inside a valid harness path. ${midElement.missingFields.join(' ')}`,
      });
    }
  }

  if (draft.wires.length === 0) {
    addValidationReason(validationReasons, {
      code: 'invalid-path',
      title: 'Invalid path',
      detail: 'Add wire connections that create one complete left-to-right harness path.',
    });
  }

  if (draft.wires.length > 0 && !hasConfiguredLeftToRightPath(draft)) {
    addValidationReason(validationReasons, {
      code: 'invalid-path',
      title: 'Invalid path',
      detail: 'The current wiring does not create a complete path from a configured left connector to a configured right connector.',
    });
  }

  for (const midElement of draft.midElements) {
    const connectionCount = adjacency.get(midElement.id)?.length ?? 0;

    if (connectionCount < 2) {
      addValidationReason(validationReasons, {
        code: 'disconnected-element',
        title: 'Disconnected element',
        detail: `${midElement.label} is not fully connected between the left and right sides of the harness path.`,
      });
      continue;
    }

    if (!validNodeIds.has(midElement.id)) {
      addValidationReason(validationReasons, {
        code: 'disconnected-element',
        title: 'Disconnected element',
        detail: `${midElement.label} is not part of one complete left-to-right harness path yet.`,
      });
    }
  }

  const validLeftConnectorCount = draft.connectors.filter(
    (connector) => connector.zone === 'left' && validNodeIds.has(connector.id),
  ).length;
  const validRightConnectorCount = draft.connectors.filter(
    (connector) => connector.zone === 'right' && validNodeIds.has(connector.id),
  ).length;

  if (validComponents.length > 1) {
    addValidationReason(validationReasons, {
      code: 'unsupported-structure',
      title: 'Unsupported structure for canvas boundary',
      detail: 'The canvas currently supports one orderable left-to-right harness path at a time.',
    });
  }

  if (validLeftConnectorCount > 1 || validRightConnectorCount > 1) {
    addValidationReason(validationReasons, {
      code: 'unsupported-structure',
      title: 'Unsupported structure for canvas boundary',
      detail: 'The current structure includes multiple active endpoints on one side. Move this request into AI or Upload for assisted review.',
    });
  }

  for (const node of getAllNodes(draft)) {
    const connectionCount = adjacency.get(node.id)?.length ?? 0;

    if (!validNodeIds.has(node.id)) {
      continue;
    }

    if (isConnectorBlock(node) && connectionCount > 1) {
      addValidationReason(validationReasons, {
        code: 'unsupported-structure',
        title: 'Unsupported structure for canvas boundary',
        detail: `${node.label} branches into more than one connection. The canvas boundary only supports one clean path per connector.`,
      });
    }

    if (isMidElementBlock(node) && connectionCount > 2) {
      addValidationReason(validationReasons, {
        code: 'unsupported-structure',
        title: 'Unsupported structure for canvas boundary',
        detail: `${node.label} branches into more than two connections. Continue with AI or Upload for non-standard routing.`,
      });
    }
  }

  const issues = validationReasons.map(formatValidationReason);

  if (
    validationReasons.some(
      (reason) =>
        reason.code === 'missing-left-connector' ||
        reason.code === 'missing-right-connector' ||
        reason.code === 'invalid-path',
    )
  ) {
    assistedReviewReasons.push(
      'Continue with AI Agent or Upload Intake if the structure does not resolve into one clear left-to-right path.',
    );
  }

  if (
    validationReasons.some(
      (reason) =>
        reason.code === 'incomplete-connector-configuration' ||
        reason.code === 'unsupported-structure',
    )
  ) {
    assistedReviewReasons.push(
      'Continue with AI Agent or Upload Intake if the connector set extends beyond one structured harness path.',
    );
  }

  if (validationReasons.some((reason) => reason.code === 'disconnected-element')) {
    assistedReviewReasons.push(
      'Continue with AI Agent or Upload Intake if the mid elements require branching, ambiguous routing, or off-canvas logic.',
    );
  }

  if (validationReasons.length > 0) {
    assistedReviewReasons.push(
      'Continue with AI Agent or Upload Intake if key details still need interpretation outside the canvas boundary.',
    );
  }

  const canSubmit = validationReasons.length === 0;

  return {
    status: canSubmit ? 'ready to submit' : 'partially configured',
    headline: canSubmit
      ? 'Ready to submit. The current structure fits the canvas boundary.'
      : 'Complete the remaining structured items before submission.',
    validationReasons,
    issues,
    assistedReviewReasons: Array.from(new Set(assistedReviewReasons)),
    canSubmit,
    quoteEstimate: buildQuoteEstimate(draft),
  };
}

export function buildLeadTimeLabel(preference: LeadTimePreference) {
  switch (preference) {
    case 'expedite':
      return 'Expedite requested';
    case 'flexible':
      return 'Flexible scheduling';
    default:
      return 'Standard lead time';
  }
}

export function createCanvasOrderDraft(draft: CanvasDraft): OrderDraft {
  const quoteEstimate = buildQuoteEstimate(draft);
  const totalLength = draft.wires.reduce((sum, wire) => sum + wire.length, 0);
  const connectorFamilies = Array.from(
    new Set(draft.connectors.map((connector) => connector.family)),
  );
  const includedConnectors = draft.connectors.map(
    (connector) =>
      `${connector.label} • ${connector.family} • ${connector.pins} pins • ${connector.awg}`,
  );
  const includedElements = draft.midElements.map(
    (item) =>
      `${item.label} • ${midElementCatalog[item.type].label} • Column ${item.column}`,
  );
  const includedWires = draft.wires.map((wire) => {
    const fromNode = getCanvasNodeById(draft, wire.fromNodeId);
    const toNode = getCanvasNodeById(draft, wire.toNodeId);

    return `${fromNode?.label ?? 'Unknown'}:${wire.fromPin} -> ${
      toNode?.label ?? 'Unknown'
    }:${wire.toPin} • ${wire.length} mm • ${wire.wireType} / ${
      wire.wireGauge
    } / ${wire.wireColor}`;
  });

  return {
    id: createEntityId('order'),
    sourceType: 'canvas',
    sourceTitle: sourceTypeLabels.canvas,
    summary: `Canvas-assisted request built from ${draft.connectors.length} connector blocks, ${draft.midElements.length} mid elements, and ${draft.wires.length} wire connections.`,
    harnessSummary: `Structured left-to-right harness path using ${connectorFamilies.join(', ')} with ${totalLength} mm of defined wire length.`,
    quantity: 1,
    leadTimePreference: 'Standard lead time',
    keyItems: [
      `Connector families: ${connectorFamilies.join(', ') || 'TBD'}`,
      `Included connectors: ${draft.connectors.length}`,
      `Included mid elements: ${draft.midElements.length}`,
      `Included wires: ${draft.wires.length}`,
    ],
    includedConnectors,
    includedElements:
      includedElements.length > 0
        ? includedElements
        : ['No mid elements included in this draft path.'],
    includedWires,
    knownAssumptions: [
      'The canvas path supports a fixed left-to-right harness structure only.',
      'Connector families are limited to the current structured canvas subset.',
      'AI handoff remains available if the request needs interpretation beyond the canvas boundary.',
    ],
    missingDetails: [
      'Final connector part numbers and terminal finish are not fully captured in the current canvas path.',
      'Reference files and manufacturing drawings are not attached to this canvas-assisted draft.',
    ],
    priceEstimate: quoteEstimate,
    detailNote:
      'Prepared from the structured canvas path and ready for draft review.',
    status: 'draft',
  };
}

export function createUploadOrderDraft(draft: UploadDraft): OrderDraft {
  const basePrice = 1200 + draft.quantity * 160;
  const expediteMultiplier =
    draft.leadTimePreference === 'expedite'
      ? 1.35
      : draft.leadTimePreference === 'flexible'
        ? 0.95
        : 1;
  const estimate = `$${Math.round(basePrice * expediteMultiplier).toLocaleString()} placeholder`;
  const leadTimePreference = buildLeadTimeLabel(draft.leadTimePreference);

  return {
    id: createEntityId('order'),
    sourceType: 'upload',
    sourceTitle: sourceTypeLabels.upload,
    summary:
      draft.description ||
      `Upload-assisted request for ${draft.projectName || 'unnamed project'}.`,
    harnessSummary:
      draft.description ||
      'Harness structure will be defined from uploaded references, AI-assisted interpretation, and project notes.',
    quantity: draft.quantity,
    leadTimePreference,
    keyItems: [
      `Project: ${draft.projectName || 'Unnamed project'}`,
      `Attachment placeholders: ${draft.attachments.join(', ') || 'None added'}`,
      `Requested quantity: ${draft.quantity}`,
      `Lead time preference: ${leadTimePreference}`,
    ],
    includedConnectors: ['To be defined during assisted review.'],
    includedElements: ['To be defined during assisted review.'],
    includedWires: ['Wire path, length, and color details will be resolved after review.'],
    knownAssumptions: [
      'Draft created from the upload form and placeholder attachments only.',
      'AI + human review will define connectors, mid elements, and routing details during early access.',
      'Quotation and lead time remain subject to review.',
    ],
    missingDetails: [
      'Exact connector families and part numbers are not yet defined.',
      'Wire routing, lengths, and color breakdown are not resolved from the upload form.',
    ],
    priceEstimate: estimate,
    detailNote:
      'Prepared from uploaded references and ready for assisted review.',
    status: 'draft',
  };
}

export function createProcessingInfo(source: FlowSource): ProcessingInfo {
  return {
    ...processingTemplates[source],
    timeline: processingTemplates[source].timeline.map((step) => ({ ...step })),
    jobs: processingTemplates[source].jobs.map((job) => ({ ...job })),
  };
}
