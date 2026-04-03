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
};

export type PreviewWire = {
  id: string;
  label: string;
  lengthLabel: string;
  specLabel: string;
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
  assumptions: string[];
  missingInfo: string[];
  attachmentsLabel: string;
  isEstimated: boolean;
  hasBranch: boolean;
  endpoints: PreviewEndpoint[];
  elements: PreviewElement[];
  wires: PreviewWire[];
};

type ParsedConnector = {
  label: string;
  family: string;
  pins: string;
  awg: string;
};

type ParsedElement = {
  label: string;
  detail: string;
  kind: PreviewElement['kind'];
};

type ParsedWire = {
  label: string;
  lengthLabel: string;
  type: string;
  gauge: string;
  color: string;
};

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (token) => {
    const normalized = token.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  });
}

function leadTimeDisplay(value: UnifiedRequest['leadTimePreference']) {
  switch (value) {
    case 'expedite':
      return '3-5 business days estimate';
    case 'flexible':
      return 'Scheduled to requirement';
    default:
      return '7-10 business days estimate';
  }
}

function parseKnownConnector(item: string): ParsedConnector {
  const parts = item
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    label: parts[0] || 'Harness endpoint',
    family: parts[1] || 'Estimated connector family',
    pins: parts[2] || 'Pin count to confirm',
    awg: parts[3] || 'AWG to confirm',
  };
}

function parseKnownElement(item: string): ParsedElement {
  const parts = item
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  const rawLabel = parts[0] || 'Inline element';
  const label = rawLabel.replace(/\b\d+\b/g, '').trim() || rawLabel;
  const normalized = `${rawLabel} ${parts[1] ?? ''}`.toLowerCase();
  const kind = normalized.includes('splice')
    ? 'splice'
    : normalized.includes('fuse')
      ? 'fuse'
      : normalized.includes('sleeve')
        ? 'sleeve'
        : 'cable';

  return {
    label,
    detail: parts[1] || 'Structured element',
    kind,
  };
}

function parseKnownWire(item: string): ParsedWire {
  const parts = item
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    label: parts[0] || 'Main harness run',
    lengthLabel: parts[1] || 'Estimated length',
    type: parts[2] || 'TXL',
    gauge: parts[3] || '20 AWG',
    color: parts[4] || 'Black',
  };
}

function extractAiEndpoints(text: string) {
  const endpoints: string[] = [];
  const directMatch =
    text.match(/connect(?:ing)?\s+(.+?)\s+to\s+(.+?)(?:[.;,\n]|$)/i) ||
    text.match(/from\s+(.+?)\s+to\s+(.+?)(?:[.;,\n]|$)/i);

  if (directMatch) {
    endpoints.push(toTitleCase(directMatch[1].trim()));
    endpoints.push(toTitleCase(directMatch[2].trim()));
  }

  const keywordCandidates = [
    'Controller',
    'Sensor',
    'Actuator',
    'Battery',
    'Motor',
    'Panel',
    'Display',
    'Junction box',
  ];

  keywordCandidates.forEach((candidate) => {
    if (new RegExp(candidate, 'i').test(text)) {
      endpoints.push(candidate);
    }
  });

  return Array.from(new Set(endpoints.filter(Boolean))).slice(0, 3);
}

function deriveConnectors(request: UnifiedRequest) {
  if (request.knownConnectors.length > 0) {
    return request.knownConnectors.map(parseKnownConnector);
  }

  const endpoints = extractAiEndpoints(`${request.draftSummary} ${request.requestSummary}`);
  const fallbackLabels =
    endpoints.length >= 2
      ? endpoints
      : ['Source device', 'Load device'];

  return fallbackLabels.map((label, index) => ({
    label,
    family: index === 0 ? 'Estimated source connector' : 'Estimated load connector',
    pins: 'Pin count to confirm',
    awg: 'AWG to confirm',
  }));
}

function deriveElements(request: UnifiedRequest, hasBranch: boolean) {
  if (request.knownElements.length > 0) {
    return request.knownElements.map(parseKnownElement);
  }

  if (hasBranch) {
    return [
      {
        label: 'Branch junction',
        detail: 'Estimated split point',
        kind: 'splice' as const,
      },
      {
        label: 'Protective sleeve',
        detail: 'Estimated loom protection',
        kind: 'sleeve' as const,
      },
    ];
  }

  return [
    {
      label: 'Main sleeve',
      detail: 'Estimated loom protection',
      kind: 'sleeve' as const,
    },
    {
      label: 'Inline support',
      detail: 'Estimated routing support',
      kind: 'cable' as const,
    },
  ];
}

function deriveWires(request: UnifiedRequest, hasBranch: boolean) {
  if (request.knownWires.length > 0) {
    return request.knownWires.map(parseKnownWire);
  }

  const inferredLength =
    request.environmentNotes.match(/\b(\d+(?:\.\d+)?)\s?(mm|cm|m|in|ft)\b/i)?.[0] ??
    'Estimated 650 mm';

  const wires = [
    {
      label: 'Main run',
      lengthLabel: inferredLength,
      type: 'TXL',
      gauge: '20 AWG',
      color: 'Black',
    },
  ];

  if (hasBranch) {
    wires.push({
      label: 'Branch run',
      lengthLabel: 'Estimated 220 mm',
      type: 'TXL',
      gauge: '22 AWG',
      color: 'Blue',
    });
  }

  return wires;
}

function hasBranching(request: UnifiedRequest, connectors: ParsedConnector[], elements: ParsedElement[]) {
  if (connectors.length > 2) {
    return true;
  }

  if (elements.some((element) => element.kind === 'splice')) {
    return true;
  }

  return /\b(branch|split|splice|junction|two sensors|three sensors|fan out)\b/i.test(
    `${request.requestSummary} ${request.draftSummary}`,
  );
}

function estimateQuoteLabel(request: UnifiedRequest, connectors: ParsedConnector[], elements: ParsedElement[]) {
  if (request.quotePlaceholder) {
    return request.quotePlaceholder;
  }

  const base =
    180 +
    connectors.length * 55 +
    elements.length * 35 +
    Math.max(request.quantity - 1, 0) * 22;
  const low = Math.round(base * 0.92);
  const high = Math.round(base * 1.18);

  return `$${low}-$${high} estimate`;
}

function buildEndpointDetails(connector: ParsedConnector) {
  return [connector.pins, connector.awg].filter(Boolean).join(' • ');
}

function normalizeAssumptions(values: string[]) {
  return values.filter(Boolean).slice(0, 3);
}

function normalizeMissing(values: string[]) {
  return values.filter(Boolean).slice(0, 4);
}

export function buildHarnessPreviewModel(request: UnifiedRequest): HarnessPreviewModel {
  const connectors = deriveConnectors(request);
  const preliminaryElements = deriveElements(request, false);
  const hasBranch = hasBranching(request, connectors, preliminaryElements);
  const elements = deriveElements(request, hasBranch).slice(0, 2);
  const wires = deriveWires(request, hasBranch);
  const sourceLabel = request.source === 'canvas' ? 'Configurator' : 'AI Agent';
  const connectorFamilies = Array.from(
    new Set(connectors.map((connector) => connector.family).filter(Boolean)),
  ).slice(0, 3);
  const mainWire = wires[0];
  const assumptions = normalizeAssumptions(request.assumptions);
  const missingInfo = normalizeMissing(request.missingInfo);
  const isEstimated =
    request.source === 'ai' ||
    connectors.some((connector) => connector.family.toLowerCase().includes('estimated')) ||
    wires.some((wire) => wire.lengthLabel.toLowerCase().includes('estimated'));
  const endpoints: PreviewEndpoint[] = [
    {
      id: 'source',
      role: 'source',
      label: connectors[0]?.label || 'Source',
      family: connectors[0]?.family || 'Estimated source connector',
      detail: buildEndpointDetails(connectors[0] ?? {
        label: '',
        family: '',
        pins: '',
        awg: '',
      }),
      estimated: isEstimated,
    },
    {
      id: 'load',
      role: 'load',
      label: connectors[1]?.label || 'Load',
      family: connectors[1]?.family || 'Estimated load connector',
      detail: buildEndpointDetails(connectors[1] ?? {
        label: '',
        family: '',
        pins: '',
        awg: '',
      }),
      estimated: isEstimated,
    },
  ];

  if (hasBranch) {
    const branchConnector = connectors[2] ?? {
      label: 'Branch endpoint',
      family: 'Estimated branch connector',
      pins: 'Pin count to confirm',
      awg: 'AWG to confirm',
    };

    endpoints.push({
      id: 'branch',
      role: 'branch',
      label: branchConnector.label,
      family: branchConnector.family,
      detail: buildEndpointDetails(branchConnector),
      estimated: true,
    });
  }

  const mainWireSpec = `${mainWire.type} • ${mainWire.gauge} • ${mainWire.color}`;

  return {
    title: request.projectName,
    sourceLabel,
    previewBadge: isEstimated ? 'AI-generated preview' : 'Structured preview',
    summary:
      request.draftSummary ||
      request.requestSummary ||
      'Harness preview generated from the current request details.',
    quantityLabel: `${request.quantity} assembly${request.quantity === 1 ? '' : 'ies'}`,
    quoteLabel: estimateQuoteLabel(request, connectors, elements),
    leadTimeLabel: request.leadTimeNote || leadTimeDisplay(request.leadTimePreference),
    connectorFamilies,
    mainWireSpec,
    assumptions,
    missingInfo,
    attachmentsLabel:
      request.attachments.length > 0
        ? `${request.attachments.length} reference file(s)`
        : 'No reference files',
    isEstimated,
    hasBranch,
    endpoints,
    elements: elements.map((element, index) => ({
      id: `element-${index}`,
      ...element,
    })),
    wires: wires.map((wire, index) => ({
      id: `wire-${index}`,
      label: wire.label,
      lengthLabel: wire.lengthLabel,
      specLabel: `${wire.type} • ${wire.gauge} • ${wire.color}`,
      estimated:
        request.source === 'ai' || wire.lengthLabel.toLowerCase().includes('estimated'),
    })),
  };
}

export function buildSampleHarnessPreviewModel(): HarnessPreviewModel {
  return {
    title: 'Generated harness preview',
    sourceLabel: 'AI Agent',
    previewBadge: 'AI-generated preview',
    summary:
      'Controller-to-sensor harness with a sealed source connector, one branch, and a protected main run.',
    quantityLabel: '25 assemblies',
    quoteLabel: '$420-$610 estimate',
    leadTimeLabel: '7-10 business days estimate',
    connectorFamilies: ['Deutsch DT', 'M12 Circular', 'TE Superseal 1.5'],
    mainWireSpec: 'TXL • 20 AWG • Black',
    assumptions: ['Branch length shown as an AI assumption pending final routing.'],
    missingInfo: ['Final mating connector part numbers still need confirmation.'],
    attachmentsLabel: '3 reference files',
    isEstimated: true,
    hasBranch: true,
    endpoints: [
      {
        id: 'source',
        role: 'source',
        label: 'Controller',
        family: 'Deutsch DT',
        detail: '4 pins • 20 AWG',
      },
      {
        id: 'load',
        role: 'load',
        label: 'Sensor A',
        family: 'M12 Circular',
        detail: '4 pins • 20 AWG',
      },
      {
        id: 'branch',
        role: 'branch',
        label: 'Sensor B',
        family: 'TE Superseal 1.5',
        detail: '3 pins • 22 AWG',
        estimated: true,
      },
    ],
    elements: [
      {
        id: 'element-1',
        label: 'Branch junction',
        detail: 'Estimated split point',
        kind: 'splice',
      },
      {
        id: 'element-2',
        label: 'Protective sleeve',
        detail: 'Main loom protection',
        kind: 'sleeve',
      },
    ],
    wires: [
      {
        id: 'wire-1',
        label: 'Main run',
        lengthLabel: '640 mm',
        specLabel: 'TXL • 20 AWG • Black',
      },
      {
        id: 'wire-2',
        label: 'Branch run',
        lengthLabel: 'Estimated 220 mm',
        specLabel: 'TXL • 22 AWG • Blue',
        estimated: true,
      },
    ],
  };
}
