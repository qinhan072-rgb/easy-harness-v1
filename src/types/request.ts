import type { CanvasDraft, LeadTimePreference } from './prototype';

export type RequestSource = 'ai' | 'canvas' | 'upload';

export type RequestStatus =
  | 'new'
  | 'needs-info'
  | 'draft-in-progress'
  | 'draft-ready'
  | 'awaiting-confirmation'
  | 'order-submitted'
  | 'quoted'
  | 'closed';

export type RequestAttachment = {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedAt: string;
};

export type UnifiedRequest = {
  id: string;
  source: RequestSource;
  projectName: string;
  requestSummary: string;
  draftSummary: string;
  manufacturableNotes: string;
  quotePlaceholder: string;
  leadTimeNote: string;
  quantity: number;
  leadTimePreference: LeadTimePreference;
  attachments: RequestAttachment[];
  canvasSnapshot: CanvasDraft | null;
  knownConnectors: string[];
  knownElements: string[];
  knownWires: string[];
  intendedUse: string;
  environmentNotes: string;
  assumptions: string[];
  missingInfo: string[];
  status: RequestStatus;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type CanvasRequestPayload = {
  projectName: string;
  requestSummary: string;
  draftSummary?: string;
  manufacturableNotes?: string;
  quotePlaceholder?: string;
  leadTimeNote?: string;
  quantity: number;
  leadTimePreference: LeadTimePreference;
  intendedUse: string;
  environmentNotes: string;
  assumptions: string[];
  missingInfo: string[];
  canvasSnapshot: CanvasDraft;
  knownConnectors: string[];
  knownElements: string[];
  knownWires: string[];
  status?: RequestStatus;
};

export type UpdateRequestPayload = {
  status?: RequestStatus;
  draftSummary?: string;
  manufacturableNotes?: string;
  quotePlaceholder?: string;
  leadTimeNote?: string;
  assumptions?: string[];
  missingInfo?: string[];
  internalNotes?: string;
};
