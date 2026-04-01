import type { CanvasDraft, MidElementType } from '../types/prototype';

export const connectorFamilyOptions = [
  'Deutsch DT',
  'Molex Micro-Fit',
  'TE Superseal',
];

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
    'Canvas V1 is intentionally narrow. It supports a fixed left-to-right harness path with a small connector family subset and four mid-element types.',
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
