import type { UnifiedRequest } from '../types/request';

type PreviewEndpointRole = 'source' | 'load' | 'branch';

export type PreviewEndpoint = {
  id: string;
  role: PreviewEndpointRole;
  label: string;
  family: string;
  detail: string;
  estimated?: boolean;
};

export type PreviewElement = {
  id: string;
  label: string;
  detail: string;
  kind: 'splice' | 'sleeve' | 'fuse' | 'cable';
  location: string;
  estimated?: boolean;
};

export type PreviewWire = {
  id: string;
  label: string;
  routeLabel: string;
  lengthLabel: string;
  specLabel: string;
  protectionLabel: string;
  estimated?: boolean;
};

export type ConnectorTableRow = {
  id: string;
  role: string;
  label: string;
  family: string;
  detail: string;
  estimated?: boolean;
};

export type ElementTableRow = {
  id: string;
  label: string;
  typeLabel: string;
  location: string;
  detail: string;
  estimated?: boolean;
};

export type WireTableRow = {
  id: string;
  label: string;
  routeLabel: string;
  lengthLabel: string;
  specLabel: string;
  protectionLabel: string;
  estimated?: boolean;
};

export type HarnessPreviewModel = {
  title: string;
  sourceLabel: string;
  previewBadge: string;
  summary: string;
  quantityLabel: string;
  quoteLabel: string;
  leadTimeLabel: string;
  connectorFamilies: string[];
  mainWireSpec: string;
  protectionLabel: string;
  assumptions: string[];
  missingInfo: string[];
  attachmentsLabel: string;
  isEstimated: boolean;
  hasBranch: boolean;
  endpoints: PreviewEndpoint[];
  elements: PreviewElement[];
  wires: PreviewWire[];
  connectorTable: ConnectorTableRow[];
  elementTable: ElementTableRow[];
  wireTable: WireTableRow[];
};

type ParsedConnector = {
  label: string;
  family: string;
  pins: string;
  awg: string;
  estimated: boolean;
};

type ParsedElement = {
  label: string;
  detail: string;
  kind: PreviewElement['kind'];
  location: string;
  estimated: boolean;
};

type ParsedWire = {
  label: string;
  routeLabel: string;
  lengthLabel: string;
  type: string;
  gauge: string;
  color: string;
  protectionLabel: string;
  estimated: boolean;
};

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (token) => {
    const normalized = token.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  });
}

function splitParts(value: string) {
  return value
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}

function simplifyNodeLabel(value: string) {
  return value.replace(/:\S+$/, '').replace(/\s+/g, ' ').trim();
}

function leadTimeDisplay(value: UnifiedRequest['leadTimePreference']) {
  switch (value) {
    case 'expedite':
      return '3 to 5 business days estimate';
    case 'flexible':
      return 'Scheduled to requirement';
    default:
      return '7 to 10 business days estimate';
  }
}

function inferConnectorFamily(text: string) {
  const candidates = [
    'Deutsch DT',
    'Deutsch DTM',
    'M12 Circular',
    'TE Superseal 1.5',
    'JST',
    'Molex Micro-Fit',
    'AMPSEAL',
  ];

  return candidates.find((candidate) => new RegExp(candidate, 'i').test(text)) ?? '';
}

function inferProtectionLabel(text: string) {
  if (/\b(braid|braided|shield)\b/i.test(text)) {
    return 'Braided sleeve';
  }

  if (/\b(sealed|outdoor|washdown|wet)\b/i.test(text)) {
    return 'Sealed loom wrap';
  }

  if (/\b(heat|high temperature|engine bay)\b/i.test(text)) {
    return 'High-temperature sleeve';
  }

  return 'Protective loom sleeve';
}

function inferEndpoints(text: string) {
  const endpoints: string[] = [];
  const directPatterns = [
    /connect(?:ing)?\s+(.+?)\s+to\s+(.+?)(?:[.;,\n]|$)/i,
    /from\s+(.+?)\s+to\s+(.+?)(?:[.;,\n]|$)/i,
  ];

  directPatterns.forEach((pattern) => {
    const match = text.match(pattern);

    if (!match) {
      return;
    }

    endpoints.push(toTitleCase(match[1].trim()));
    endpoints.push(toTitleCase(match[2].trim()));
  });

  const keywordCandidates = [
    'Controller',
    'Sensor',
    'Actuator',
    'Battery',
    'Motor',
    'Panel',
    'Junction box',
    'Display',
  ];

  keywordCandidates.forEach((candidate) => {
    if (new RegExp(candidate, 'i').test(text)) {
      endpoints.push(candidate);
    }
  });

  return Array.from(new Set(endpoints.filter(Boolean))).slice(0, 3);
}

function hasBranching(text: string, connectorCount: number, elementKinds: ParsedElement[]) {
  if (connectorCount > 2) {
    return true;
  }

  if (elementKinds.some((element) => element.kind === 'splice')) {
    return true;
  }

  return /\b(branch|split|splice|junction|fan out|two sensors|three sensors|dual sensor)\b/i.test(
    text,
  );
}

function parseKnownConnector(item: string): ParsedConnector {
  const parts = splitParts(item);
  const family = parts[1] || 'Connector family to confirm';

  return {
    label: parts[0] || 'Harness endpoint',
    family,
    pins: parts[2] || 'Pin count to confirm',
    awg: parts[3] || 'AWG to confirm',
    estimated: /confirm|estimate/i.test(`${family} ${parts[2] ?? ''} ${parts[3] ?? ''}`),
  };
}

function parseKnownElement(item: string): ParsedElement {
  const parts = splitParts(item);
  const rawLabel = parts[0] || 'Inline element';
  const detail = parts[1] || 'Structured element';
  const normalized = `${rawLabel} ${detail}`.toLowerCase();
  const kind = normalized.includes('splice')
    ? 'splice'
    : normalized.includes('fuse')
      ? 'fuse'
      : normalized.includes('sleeve')
        ? 'sleeve'
        : 'cable';

  return {
    label: rawLabel,
    detail,
    kind,
    location: parts[2] || 'Main run',
    estimated: /estimate|confirm/i.test(detail),
  };
}

function parseKnownWire(item: string, defaultProtectionLabel: string): ParsedWire {
  const parts = splitParts(item);
  const routeSegment = parts[0] || 'Main run';
  const routeMatch = routeSegment.match(/(.+?)\s*->\s*(.+)/);
  const fromLabel = simplifyNodeLabel(routeMatch?.[1] || 'Source');
  const toLabel = simplifyNodeLabel(routeMatch?.[2] || 'Load');
  const type = parts[2] || 'TXL';
  const gauge = parts[3] || '20 AWG';
  const color = parts[4] || 'Black';

  return {
    label: routeMatch ? `${fromLabel} run` : routeSegment,
    routeLabel: `${fromLabel} to ${toLabel}`,
    lengthLabel: parts[1] || 'Estimated length',
    type,
    gauge,
    color,
    protectionLabel: defaultProtectionLabel,
    estimated: /estimate|confirm/i.test(`${parts[1] ?? ''} ${type} ${gauge} ${color}`),
  };
}

function deriveConnectors(request: UnifiedRequest, text: string) {
  if (request.knownConnectors.length > 0) {
    return request.knownConnectors.map(parseKnownConnector);
  }

  const endpoints = inferEndpoints(text);
  const inferredFamily = inferConnectorFamily(text);
  const fallbackLabels =
    endpoints.length >= 2 ? endpoints : ['Source device', 'Load device'];

  return fallbackLabels.map((label, index) => ({
    label,
    family:
      inferredFamily ||
      (index === 0 ? 'Source connector to confirm' : 'Load connector to confirm'),
    pins: 'Pin count to confirm',
    awg: '20 AWG estimate',
    estimated: true,
  }));
}

function deriveElements(
  request: UnifiedRequest,
  text: string,
  hasBranch: boolean,
  protectionLabel: string,
) {
  if (request.knownElements.length > 0) {
    return request.knownElements.map(parseKnownElement);
  }

  const elements: ParsedElement[] = [];

  if (hasBranch) {
    elements.push({
      label: 'Branch junction',
      detail: 'Split point for the branch run',
      kind: 'splice',
      location: 'Branch point',
      estimated: true,
    });
  }

  if (/\bfuse\b/i.test(text)) {
    elements.push({
      label: 'Inline fuse',
      detail: 'Fuse holder placement to confirm',
      kind: 'fuse',
      location: 'Main run',
      estimated: true,
    });
  }

  elements.push({
    label: protectionLabel,
    detail: 'Harness protection and routing cover',
    kind: 'sleeve',
    location: 'Main run',
    estimated: true,
  });

  return elements.slice(0, 3);
}

function inferMainLength(text: string) {
  const match = text.match(
    /\b(\d+(?:\.\d+)?)\s?(mm|cm|m|meter|meters|metre|metres|in|inch|inches|ft|feet)\b/i,
  );

  return match ? `${match[1]} ${match[2]}` : 'Estimated 650 mm';
}

function deriveWires(
  request: UnifiedRequest,
  text: string,
  hasBranch: boolean,
  protectionLabel: string,
  connectors: ParsedConnector[],
) {
  if (request.knownWires.length > 0) {
    return request.knownWires.map((item) => parseKnownWire(item, protectionLabel));
  }

  const mainLength = inferMainLength(text);
  const sourceLabel = connectors[0]?.label || 'Source';
  const loadLabel = connectors[1]?.label || 'Load';
  const wires: ParsedWire[] = [
    {
      label: 'Main trunk',
      routeLabel: `${sourceLabel} to ${loadLabel}`,
      lengthLabel: mainLength,
      type: 'TXL',
      gauge: '20 AWG',
      color: 'Black',
      protectionLabel,
      estimated: true,
    },
  ];

  if (hasBranch) {
    const branchLabel = connectors[2]?.label || 'Branch endpoint';
    wires.push({
      label: 'Branch run',
      routeLabel: `${sourceLabel} to ${branchLabel}`,
      lengthLabel: 'Estimated 220 mm',
      type: 'TXL',
      gauge: '22 AWG',
      color: 'Blue',
      protectionLabel,
      estimated: true,
    });
  }

  return wires;
}

function estimateQuoteLabel(
  request: UnifiedRequest,
  connectors: ParsedConnector[],
  elements: ParsedElement[],
  wires: ParsedWire[],
) {
  if (request.quotePlaceholder) {
    return request.quotePlaceholder;
  }

  const base =
    180 +
    connectors.length * 65 +
    elements.length * 35 +
    wires.length * 40 +
    Math.max(request.quantity - 1, 0) * 22;
  const low = Math.round(base * 0.92);
  const high = Math.round(base * 1.18);

  return `$${low} to $${high} estimate`;
}

function normalizeAssumptions(values: string[]) {
  return values.filter(Boolean).slice(0, 4);
}

function normalizeMissing(values: string[]) {
  return values.filter(Boolean).slice(0, 5);
}

function buildEndpointDetail(connector: ParsedConnector) {
  return [connector.pins, connector.awg].filter(Boolean).join(' / ');
}

export function buildHarnessPreviewModel(request: UnifiedRequest): HarnessPreviewModel {
  const text = `${request.draftSummary} ${request.requestSummary} ${request.environmentNotes}`.trim();
  const protectionLabel = inferProtectionLabel(text);
  const connectors = deriveConnectors(request, text);
  const initialElements = deriveElements(request, text, false, protectionLabel);
  const hasBranch = hasBranching(text, connectors.length, initialElements);
  const elements = deriveElements(request, text, hasBranch, protectionLabel);
  const wires = deriveWires(request, text, hasBranch, protectionLabel, connectors);
  const sourceLabel = request.source === 'canvas' ? 'Configurator' : 'AI Agent';
  const isEstimated =
    request.source === 'ai' ||
    connectors.some((connector) => connector.estimated) ||
    elements.some((element) => element.estimated) ||
    wires.some((wire) => wire.estimated);

  const endpoints: PreviewEndpoint[] = [
    {
      id: 'endpoint-source',
      role: 'source',
      label: connectors[0]?.label || 'Source',
      family: connectors[0]?.family || 'Source connector',
      detail: buildEndpointDetail(connectors[0] ?? {
        label: '',
        family: '',
        pins: '',
        awg: '',
        estimated: true,
      }),
      estimated: connectors[0]?.estimated ?? isEstimated,
    },
    {
      id: 'endpoint-load',
      role: 'load',
      label: connectors[1]?.label || 'Load',
      family: connectors[1]?.family || 'Load connector',
      detail: buildEndpointDetail(connectors[1] ?? {
        label: '',
        family: '',
        pins: '',
        awg: '',
        estimated: true,
      }),
      estimated: connectors[1]?.estimated ?? isEstimated,
    },
  ];

  if (hasBranch) {
    const branchConnector = connectors[2] ?? {
      label: 'Branch endpoint',
      family: 'Branch connector to confirm',
      pins: 'Pin count to confirm',
      awg: '22 AWG estimate',
      estimated: true,
    };

    endpoints.push({
      id: 'endpoint-branch',
      role: 'branch',
      label: branchConnector.label,
      family: branchConnector.family,
      detail: buildEndpointDetail(branchConnector),
      estimated: branchConnector.estimated,
    });
  }

  const connectorFamilies = Array.from(
    new Set(connectors.map((connector) => connector.family).filter(Boolean)),
  ).slice(0, 4);
  const mainWire = wires[0];

  return {
    title: request.projectName,
    sourceLabel,
    previewBadge: 'Generated harness preview',
    summary:
      request.draftSummary ||
      request.requestSummary ||
      'Generated from the current harness request.',
    quantityLabel: `${request.quantity} harness${request.quantity === 1 ? '' : 'es'}`,
    quoteLabel: estimateQuoteLabel(request, connectors, elements, wires),
    leadTimeLabel: request.leadTimeNote || leadTimeDisplay(request.leadTimePreference),
    connectorFamilies,
    mainWireSpec: `${mainWire.type} / ${mainWire.gauge} / ${mainWire.color}`,
    protectionLabel,
    assumptions: normalizeAssumptions(request.assumptions),
    missingInfo: normalizeMissing(request.missingInfo),
    attachmentsLabel:
      request.attachments.length > 0
        ? `${request.attachments.length} reference file(s)`
        : 'No reference files',
    isEstimated,
    hasBranch,
    endpoints,
    elements: elements.map((element, index) => ({
      id: `element-${index + 1}`,
      label: element.label,
      detail: element.detail,
      kind: element.kind,
      location: element.location,
      estimated: element.estimated,
    })),
    wires: wires.map((wire, index) => ({
      id: `wire-${index + 1}`,
      label: wire.label,
      routeLabel: wire.routeLabel,
      lengthLabel: wire.lengthLabel,
      specLabel: `${wire.type} / ${wire.gauge} / ${wire.color}`,
      protectionLabel: wire.protectionLabel,
      estimated: wire.estimated,
    })),
    connectorTable: endpoints.map((endpoint) => ({
      id: endpoint.id,
      role:
        endpoint.role === 'source'
          ? 'Source'
          : endpoint.role === 'load'
            ? 'Load'
            : 'Branch',
      label: endpoint.label,
      family: endpoint.family,
      detail: endpoint.detail,
      estimated: endpoint.estimated,
    })),
    elementTable: elements.map((element, index) => ({
      id: `element-row-${index + 1}`,
      label: element.label,
      typeLabel:
        element.kind === 'splice'
          ? 'Splice'
          : element.kind === 'fuse'
            ? 'Fuse'
            : element.kind === 'sleeve'
              ? 'Protection'
              : 'Cable support',
      location: element.location,
      detail: element.detail,
      estimated: element.estimated,
    })),
    wireTable: wires.map((wire, index) => ({
      id: `wire-row-${index + 1}`,
      label: wire.label,
      routeLabel: wire.routeLabel,
      lengthLabel: wire.lengthLabel,
      specLabel: `${wire.type} / ${wire.gauge} / ${wire.color}`,
      protectionLabel: wire.protectionLabel,
      estimated: wire.estimated,
    })),
  };
}

export function buildSampleHarnessPreviewModel(): HarnessPreviewModel {
  return {
    title: 'Controller branch harness',
    sourceLabel: 'AI Agent',
    previewBadge: 'Generated harness preview',
    summary:
      'Sealed controller harness with one branch to two sensors, a protected main trunk, and one inline fuse position.',
    quantityLabel: '25 harnesses',
    quoteLabel: '$420 to $610 estimate',
    leadTimeLabel: '7 to 10 business days estimate',
    connectorFamilies: ['Deutsch DT', 'M12 Circular', 'TE Superseal 1.5'],
    mainWireSpec: 'TXL / 20 AWG / Black',
    protectionLabel: 'Sealed loom wrap',
    assumptions: ['Branch length is estimated from the current routing note.'],
    missingInfo: ['Final mating connector part numbers still need confirmation.'],
    attachmentsLabel: '3 reference file(s)',
    isEstimated: true,
    hasBranch: true,
    endpoints: [
      {
        id: 'endpoint-source',
        role: 'source',
        label: 'Controller',
        family: 'Deutsch DT',
        detail: '4 pins / 20 AWG',
      },
      {
        id: 'endpoint-load',
        role: 'load',
        label: 'Sensor A',
        family: 'M12 Circular',
        detail: '4 pins / 20 AWG',
      },
      {
        id: 'endpoint-branch',
        role: 'branch',
        label: 'Sensor B',
        family: 'TE Superseal 1.5',
        detail: '3 pins / 22 AWG',
        estimated: true,
      },
    ],
    elements: [
      {
        id: 'element-1',
        label: 'Branch junction',
        detail: 'Split point for the branch run',
        kind: 'splice',
        location: 'Branch point',
        estimated: true,
      },
      {
        id: 'element-2',
        label: 'Inline fuse',
        detail: 'Fuse holder position to confirm',
        kind: 'fuse',
        location: 'Main run',
        estimated: true,
      },
      {
        id: 'element-3',
        label: 'Sealed loom wrap',
        detail: 'Harness protection and routing cover',
        kind: 'sleeve',
        location: 'Main run',
        estimated: true,
      },
    ],
    wires: [
      {
        id: 'wire-1',
        label: 'Main trunk',
        routeLabel: 'Controller to Sensor A',
        lengthLabel: '640 mm',
        specLabel: 'TXL / 20 AWG / Black',
        protectionLabel: 'Sealed loom wrap',
      },
      {
        id: 'wire-2',
        label: 'Branch run',
        routeLabel: 'Controller to Sensor B',
        lengthLabel: 'Estimated 220 mm',
        specLabel: 'TXL / 22 AWG / Blue',
        protectionLabel: 'Sealed loom wrap',
        estimated: true,
      },
    ],
    connectorTable: [
      {
        id: 'connector-source',
        role: 'Source',
        label: 'Controller',
        family: 'Deutsch DT',
        detail: '4 pins / 20 AWG',
      },
      {
        id: 'connector-load',
        role: 'Load',
        label: 'Sensor A',
        family: 'M12 Circular',
        detail: '4 pins / 20 AWG',
      },
      {
        id: 'connector-branch',
        role: 'Branch',
        label: 'Sensor B',
        family: 'TE Superseal 1.5',
        detail: '3 pins / 22 AWG',
        estimated: true,
      },
    ],
    elementTable: [
      {
        id: 'element-row-1',
        label: 'Branch junction',
        typeLabel: 'Splice',
        location: 'Branch point',
        detail: 'Split point for the branch run',
        estimated: true,
      },
      {
        id: 'element-row-2',
        label: 'Inline fuse',
        typeLabel: 'Fuse',
        location: 'Main run',
        detail: 'Fuse holder position to confirm',
        estimated: true,
      },
      {
        id: 'element-row-3',
        label: 'Sealed loom wrap',
        typeLabel: 'Protection',
        location: 'Main run',
        detail: 'Harness protection and routing cover',
        estimated: true,
      },
    ],
    wireTable: [
      {
        id: 'wire-row-1',
        label: 'Main trunk',
        routeLabel: 'Controller to Sensor A',
        lengthLabel: '640 mm',
        specLabel: 'TXL / 20 AWG / Black',
        protectionLabel: 'Sealed loom wrap',
      },
      {
        id: 'wire-row-2',
        label: 'Branch run',
        routeLabel: 'Controller to Sensor B',
        lengthLabel: 'Estimated 220 mm',
        specLabel: 'TXL / 22 AWG / Blue',
        protectionLabel: 'Sealed loom wrap',
        estimated: true,
      },
    ],
  };
}
