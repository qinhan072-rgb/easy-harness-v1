import type { CanvasDraft, MidElementType } from '../types/prototype';

export const connectorFamilyCatalog = [
  {
    label: 'Deutsch DT',
    detail: 'Sealed signal connector commonly used in rugged harness builds.',
    tags: ['sealed', 'signal', 'automotive'],
  },
  {
    label: 'Deutsch DTM',
    detail: 'Compact sealed connector for lower-current circuits.',
    tags: ['sealed', 'compact', 'signal'],
  },
  {
    label: 'Deutsch DTP',
    detail: 'Higher-current sealed connector for power distribution paths.',
    tags: ['sealed', 'power', 'automotive'],
  },
  {
    label: 'TE Superseal 1.5',
    detail: 'Popular sealed automotive connector family.',
    tags: ['sealed', 'automotive', 'signal'],
  },
  {
    label: 'TE AMPSEAL 16',
    detail: 'Multi-pin sealed interface for denser control harnesses.',
    tags: ['sealed', 'multi-pin', 'control'],
  },
  {
    label: 'TE MATE-N-LOK',
    detail: 'General-purpose power and signal connector family.',
    tags: ['power', 'general', 'signal'],
  },
  {
    label: 'Molex Micro-Fit',
    detail: 'Compact power and mixed-signal connector with positive latch.',
    tags: ['compact', 'power', 'board'],
  },
  {
    label: 'Molex Mini-Fit Jr',
    detail: 'Larger current-capable connector for power paths.',
    tags: ['power', 'general', 'board'],
  },
  {
    label: 'Molex MX150',
    detail: 'Sealed automotive connector family for harsh environments.',
    tags: ['sealed', 'automotive', 'signal'],
  },
  {
    label: 'JST JWPF',
    detail: 'Compact waterproof connector family for smaller harnesses.',
    tags: ['sealed', 'compact', 'sensor'],
  },
  {
    label: 'JST VH',
    detail: 'Simple board-to-wire connector family for light power and signal.',
    tags: ['board', 'compact', 'general'],
  },
  {
    label: 'Weather Pack',
    detail: 'Legacy sealed automotive connector often used in field service work.',
    tags: ['sealed', 'automotive', 'service'],
  },
  {
    label: 'Metri-Pack 150',
    detail: 'Compact sealed automotive connector for lower-current circuits.',
    tags: ['sealed', 'automotive', 'compact'],
  },
  {
    label: 'Metri-Pack 280',
    detail: 'Sealed automotive connector for moderate current and durability.',
    tags: ['sealed', 'automotive', 'power'],
  },
  {
    label: 'Sumitomo HM 090',
    detail: 'Automotive connector family used in many OEM harnesses.',
    tags: ['sealed', 'automotive', 'oem'],
  },
  {
    label: 'M8 Circular',
    detail: 'Circular sensor connector for compact industrial devices.',
    tags: ['sensor', 'industrial', 'circular'],
  },
  {
    label: 'M12 Circular',
    detail: 'Circular connector for industrial sensors and networked devices.',
    tags: ['sensor', 'industrial', 'circular'],
  },
];

export const connectorFamilyOptions = connectorFamilyCatalog.map(
  (item) => item.label,
);

export const connectorPinOptions = [2, 4, 6, 8, 12];

export const awgOptions = ['18 AWG', '20 AWG', '22 AWG', '24 AWG'];

export const midElementCatalog: Record<
  MidElementType,
  { label: string; detail: string; ports: string[] }
> = {
  splice: {
    label: 'Splice',
    detail: 'Join conductors or branch a signal path.',
    ports: ['A', 'B', 'TAP'],
  },
  cable: {
    label: 'Cable',
    detail: 'Represent a bundled cable segment.',
    ports: ['IN', 'OUT'],
  },
  fuse: {
    label: 'Fuse',
    detail: 'Inline protection placeholder.',
    ports: ['IN', 'OUT'],
  },
  sleeve: {
    label: 'Sleeve',
    detail: 'Protective sleeve segment around a run.',
    ports: ['START', 'END'],
  },
};

export const midElementColumnOptions: Array<1 | 2 | 3> = [1, 2, 3];

export const wireTypeOptions = [
  'TXL',
  'GPT',
  'Shielded pair',
];

export const canvasV1Scope = {
  connectorFamilies: connectorFamilyOptions,
  midElementTypes: ['splice', 'cable', 'fuse', 'sleeve'] as const,
  wireTypes: wireTypeOptions,
  summary:
    'Canvas V1 is one ordering path inside Easy Harness. It is intentionally narrow and supports only a fixed left-to-right harness subset.',
};

export const wireColorOptions = [
  'Black',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'White',
];

export const initialCanvasDraft: CanvasDraft = {
  connectors: [],
  midElements: [],
  wires: [],
  lastFeedback: null,
};
