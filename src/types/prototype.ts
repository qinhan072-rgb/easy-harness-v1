export type FlowSource = 'canvas' | 'upload';
export type ConnectorZone = 'left' | 'right';
export type MidElementType = 'splice' | 'cable' | 'fuse' | 'sleeve';
export type LeadTimePreference = 'standard' | 'expedite' | 'flexible';
export type CanvasReadiness =
  | 'empty'
  | 'partially configured'
  | 'ready to submit';
export type OrderDraftStatus = 'draft' | 'confirmed' | 'changes-requested';
export type CanvasBlockConfigurationState = 'configured' | 'incomplete';

export type ConnectorBlock = {
  kind: 'connector';
  id: string;
  label: string;
  family: string;
  pins: number;
  options: string[];
  awg: string;
  zone: ConnectorZone;
  configurationState: CanvasBlockConfigurationState;
  missingFields: string[];
};

export type MidElementBlock = {
  kind: 'mid-element';
  id: string;
  label: string;
  type: MidElementType;
  column: 1 | 2 | 3;
  detail: string;
  ports: string[];
  configurationState: CanvasBlockConfigurationState;
  missingFields: string[];
};

export type CanvasNode = ConnectorBlock | MidElementBlock;

export type WireConnection = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromPin: string;
  toPin: string;
  length: number;
  wireType: string;
  wireGauge: string;
  wireColor: string;
};

export type CanvasDraft = {
  connectors: ConnectorBlock[];
  midElements: MidElementBlock[];
  wires: WireConnection[];
  lastFeedback: string | null;
};

export type UploadDraft = {
  projectName: string;
  description: string;
  attachments: string[];
  quantity: number;
  leadTimePreference: LeadTimePreference;
};

export type ProcessingStep = {
  stage: string;
  time: string;
  state: 'done' | 'active' | 'upcoming';
};

export type ProcessingJob = {
  title: string;
  owner: string;
  detail: string;
};

export type ProcessingInfo = {
  title: string;
  detail: string;
  etaLabel: string;
  timeline: ProcessingStep[];
  jobs: ProcessingJob[];
};

export type OrderDraft = {
  id: string;
  sourceType: FlowSource;
  sourceTitle: string;
  summary: string;
  harnessSummary: string;
  quantity: number;
  leadTimePreference: string;
  keyItems: string[];
  includedConnectors: string[];
  includedElements: string[];
  includedWires: string[];
  knownAssumptions: string[];
  missingDetails: string[];
  priceEstimate: string;
  detailNote: string;
  status: OrderDraftStatus;
};

export type PrototypeState = {
  canvasDraft: CanvasDraft;
  uploadDraft: UploadDraft;
  uploadFeedback: string | null;
  flowSource: FlowSource | null;
  processingInfo: ProcessingInfo | null;
  orderDraft: OrderDraft | null;
  orderFeedback: string | null;
};

export type ConnectorDraftInput = {
  label: string;
  family: string;
  pins: number;
  options: string[];
  awg: string;
  zone: ConnectorZone;
};

export type MidElementDraftInput = {
  label: string;
  type: MidElementType;
  column: 1 | 2 | 3;
};

export type WireConnectionInput = {
  fromNodeId: string;
  toNodeId: string;
  fromPin: string;
  toPin: string;
  length: number;
  wireType: string;
  wireGauge: string;
  wireColor: string;
};
