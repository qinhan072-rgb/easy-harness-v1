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

export type CanvasEvaluation = {
  status: CanvasReadiness;
  headline: string;
  issues: string[];
  assistedReviewReasons: string[];
  canSubmit: boolean;
  quoteEstimate: string;
};

export function createEntityId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
    return 'This connection does not move the harness path forward. Canvas V1 expects connections to advance from the left side toward the right side.';
  }

  if (fromTrack > toTrack) {
    return 'This connection runs backward. Canvas V1 only supports left-to-right harness paths.';
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
    return `The source point ${input.fromPin} on ${fromNode.label} is already committed to another wire.`;
  }

  if (occupiedEndpoints.has(endpointKey(input.toNodeId, input.toPin))) {
    return `The target point ${input.toPin} on ${toNode.label} is already committed to another wire.`;
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
  const { adjacency } = getCanvasComponents(draft);
  const validNodeIds = getValidHarnessNodeIds(draft);
  const issues: string[] = [];
  const assistedReviewReasons: string[] = [];

  if (totalBlocks === 0 && draft.wires.length === 0) {
    return {
      status: 'empty',
      headline:
        'Your current setup is incomplete for order submission. Start with a configured connector on each side, or move this request to assisted review.',
      issues: [
        'Missing a connector on the left side.',
        'Missing a connector on the right side.',
        'A complete harness path has not been defined yet.',
      ],
      assistedReviewReasons: [
        'This request may be better handled through assisted review if you already have reference files or need a family outside the Canvas V1 subset.',
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
    issues.push('Missing a configured connector on the left side.');
  }

  if (configuredRightConnectors.length === 0) {
    issues.push('Missing a configured connector on the right side.');
  }

  for (const connector of draft.connectors) {
    if (connector.configurationState === 'incomplete') {
      issues.push(
        `Connector ${connector.label} is not fully configured yet. ${connector.missingFields.join(
          ' ',
        )}`,
      );
      continue;
    }

    const connectionCount = adjacency.get(connector.id)?.length ?? 0;

    if (connectionCount === 0) {
      issues.push(
        `Connector ${connector.label} is not connected into the harness path yet.`,
      );
      continue;
    }

    if (!validNodeIds.has(connector.id)) {
      issues.push(
        `Connector ${connector.label} is not connected into a valid left-to-right harness path yet.`,
      );
    }
  }

  for (const midElement of draft.midElements) {
    if (midElement.configurationState === 'incomplete') {
      issues.push(
        `Mid element ${midElement.label} is not fully configured yet. ${midElement.missingFields.join(
          ' ',
        )}`,
      );
    }
  }

  if (draft.wires.length === 0) {
    issues.push(
      'Your current setup is incomplete for order submission. Add at least one wire connection.',
    );
  }

  if (draft.wires.length > 0 && !hasConfiguredLeftToRightPath(draft)) {
    issues.push(
      'Your current setup is incomplete for order submission. Add a complete path from a configured left connector to a configured right connector.',
    );
  }

  for (const midElement of draft.midElements) {
    const connectionCount = adjacency.get(midElement.id)?.length ?? 0;

    if (connectionCount < 2) {
      issues.push(
        `This mid element is not connected into a valid harness path: ${midElement.label}.`,
      );
      continue;
    }

    if (!validNodeIds.has(midElement.id)) {
      issues.push(
        `This mid element is not connected into a valid harness path: ${midElement.label}.`,
      );
    }
  }

  if (issues.some((issue) => issue.includes('configured connector'))) {
    assistedReviewReasons.push(
      'If the structure does not naturally resolve into a left-to-right harness path, this request may be better handled through assisted review.',
    );
  }

  if (issues.some((issue) => issue.includes('Connector'))) {
    assistedReviewReasons.push(
      'If your connector set cannot be cleanly resolved into one orderable harness path, move this request to Upload / Assisted Request.',
    );
  }

  if (issues.some((issue) => issue.includes('mid element'))) {
    assistedReviewReasons.push(
      'If your mid elements need branching, ambiguous routing, or off-canvas logic, use Upload / Assisted Request instead.',
    );
  }

  if (
    issues.some(
      (issue) =>
        issue.includes('not fully configured yet') ||
        issue.includes('incomplete for order submission'),
    )
  ) {
    assistedReviewReasons.push(
      'If key details are still unclear, submit for assisted review so references and assumptions can be reconciled outside the Canvas V1 boundary.',
    );
  }

  const canSubmit = issues.length === 0;

  return {
    status: canSubmit ? 'ready to submit' : 'partially configured',
    headline: canSubmit
      ? 'Ready to submit. The current harness path fits within Configurator V1.'
      : 'Your current setup is incomplete for order submission.',
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
      return 'Standard prototype lead time';
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
    summary: `Canvas draft built from ${draft.connectors.length} connector blocks, ${draft.midElements.length} mid elements, and ${draft.wires.length} wire connections.`,
    harnessSummary: `Single V1 left-to-right harness path using ${connectorFamilies.join(', ')} with ${totalLength} mm of defined wire length.`,
    quantity: 1,
    leadTimePreference: 'Standard prototype lead time',
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
      'Canvas V1 supports a fixed left-to-right harness path only.',
      'Connector families are limited to the current V1 subset.',
      'Quote, lead time, and order packaging remain front-end placeholders.',
    ],
    missingDetails: [
      'Final connector part numbers and terminal finish are not captured in Canvas V1.',
      'Reference files and manufacturing drawings are not attached to this canvas-only draft.',
    ],
    priceEstimate: quoteEstimate,
    detailNote:
      'Generated from the fixed-syntax canvas prototype. This is a front-end-only draft.',
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
      `Uploaded request for ${draft.projectName || 'unnamed project'}.`,
    harnessSummary:
      draft.description ||
      'Harness structure will be defined during assisted review from uploaded references and project notes.',
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
      'Assisted review will define connectors, mid elements, and routing details.',
      'Quote and lead time remain front-end placeholders in this prototype.',
    ],
    missingDetails: [
      'Exact connector families and part numbers are not yet defined.',
      'Wire routing, lengths, and color breakdown are not resolved from the upload form.',
    ],
    priceEstimate: estimate,
    detailNote:
      'Generated from the upload / assisted request form. This is a front-end-only draft.',
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
