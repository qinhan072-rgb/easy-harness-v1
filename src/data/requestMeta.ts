import type { RequestSource, RequestStatus } from '../types/request';

export type PublicRequestStage =
  | 'request-received'
  | 'in-preparation'
  | 'review-required'
  | 'submitted';

export const requestSourceLabels: Record<RequestSource, string> = {
  ai: 'AI Agent',
  canvas: 'Configurator',
  upload: 'Upload Intake',
};

export const publicRequestSourceLabels: Record<RequestSource, string> = {
  ai: 'AI Agent',
  canvas: 'Configurator',
  upload: 'AI Agent files',
};

export const requestStatusMeta: Record<
  RequestStatus,
  { label: string; description: string }
> = {
  new: {
    label: 'New',
    description: 'Your intake record has been received.',
  },
  'needs-info': {
    label: 'Needs info',
    description: 'Additional details are required before draft preparation can continue.',
  },
  'draft-in-progress': {
    label: 'Draft in progress',
    description: 'Draft preparation is underway.',
  },
  'draft-ready': {
    label: 'Draft ready',
    description: 'Your draft is ready for review.',
  },
  'awaiting-confirmation': {
    label: 'Awaiting confirmation',
    description: 'Waiting for your response.',
  },
  'order-submitted': {
    label: 'Order submitted',
    description: 'Order received. Payment and final handling are next.',
  },
  quoted: {
    label: 'Quoted',
    description: 'Quotation handling is underway.',
  },
  closed: {
    label: 'Closed',
    description: 'Request closed.',
  },
};

export const requestStatusOptions = Object.entries(requestStatusMeta).map(
  ([value, meta]) => ({
    value: value as RequestStatus,
    label: meta.label,
  }),
);

export const draftReadyStatuses = new Set<RequestStatus>([
  'draft-ready',
  'awaiting-confirmation',
]);

export const publicOrderDraftStatuses = new Set<RequestStatus>([
  'draft-ready',
  'awaiting-confirmation',
  'quoted',
  'order-submitted',
  'closed',
]);

export const publicCanvasReviewStatuses = new Set<RequestStatus>([
  'draft-ready',
  'order-submitted',
]);

export const publicPreviewStatuses = new Set<RequestStatus>([
  'draft-ready',
  'awaiting-confirmation',
  'quoted',
  'order-submitted',
  'closed',
]);

export const publicRequestStageMeta: Record<
  PublicRequestStage,
  {
    label: string;
    currentState: string;
    currentDetail: string;
    nextStep: string;
  }
> = {
  'request-received': {
    label: 'Request received',
    currentState: 'Your request has been received.',
    currentDetail:
      'The team is checking the intake details and preparing the next step.',
    nextStep:
      'The request will move into preparation after the intake record is checked.',
  },
  'in-preparation': {
    label: 'In preparation',
    currentState: 'Your request is being prepared.',
    currentDetail:
      'We are reviewing the intake details and organizing the request for draft preparation.',
    nextStep:
      'A prepared draft will become available when the request is ready for review.',
  },
  'review-required': {
    label: 'Review required',
    currentState: 'Your draft is ready for review.',
    currentDetail:
      'Please review the prepared order details before the request moves forward.',
    nextStep:
      'Open the prepared draft and confirm the next action when you are ready.',
  },
  submitted: {
    label: 'Submitted',
    currentState: 'Your order has moved forward.',
    currentDetail: 'The request is now in the submitted stage.',
    nextStep:
      'Payment and final handling are next. The team may contact you if one final detail still needs confirmation.',
  },
};

export function getPublicRequestStage(status: RequestStatus): PublicRequestStage {
  switch (status) {
    case 'new':
      return 'request-received';
    case 'needs-info':
    case 'draft-in-progress':
      return 'in-preparation';
    case 'draft-ready':
    case 'awaiting-confirmation':
      return 'review-required';
    case 'quoted':
    case 'order-submitted':
    case 'closed':
      return 'submitted';
  }
}

const statusOrder: RequestStatus[] = [
  'new',
  'needs-info',
  'draft-in-progress',
  'draft-ready',
  'awaiting-confirmation',
  'quoted',
  'order-submitted',
  'closed',
];

export function formatRequestTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

export function buildStatusTimeline(status: RequestStatus) {
  if (status === 'order-submitted') {
    return [
      { stage: 'New', time: 'Complete', state: 'done' as const },
      { stage: 'Draft ready', time: 'Complete', state: 'done' as const },
      {
        stage: requestStatusMeta['order-submitted'].label,
        time: 'Current',
        state: 'active' as const,
      },
      { stage: 'Final handling', time: 'Pending', state: 'upcoming' as const },
    ];
  }

  const activeIndex = statusOrder.indexOf(status);

  return statusOrder.map((stage, index) => ({
    stage: requestStatusMeta[stage].label,
    time:
      index < activeIndex ? 'Complete' : index === activeIndex ? 'Current' : 'Pending',
    state:
      index < activeIndex
        ? ('done' as const)
        : index === activeIndex
          ? ('active' as const)
          : ('upcoming' as const),
  }));
}
