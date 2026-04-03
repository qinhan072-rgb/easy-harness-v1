import type { RequestSource, RequestStatus } from '../types/request';

export const requestSourceLabels: Record<RequestSource, string> = {
  ai: 'AI Agent',
  canvas: 'Configurator Canvas',
  upload: 'Upload Intake',
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
