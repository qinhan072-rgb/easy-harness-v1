import type {
  FlowSource,
  OrderDraftStatus,
  ProcessingInfo,
} from '../types/prototype';

export const sourceTypeLabels: Record<FlowSource, string> = {
  canvas: 'Configurator Canvas',
  upload: 'Upload / Assisted Request',
};

export const orderStatusCopy: Record<
  OrderDraftStatus,
  { label: string; description: string }
> = {
  draft: {
    label: 'Draft ready',
    description: 'Front-end generated draft order, ready for review.',
  },
  confirmed: {
    label: 'Confirmed',
    description: 'The draft has been confirmed in this prototype flow.',
  },
  'changes-requested': {
    label: 'Changes requested',
    description:
      'The draft needs updates before it should be treated as accepted.',
  },
};

export const processingTemplates: Record<FlowSource, ProcessingInfo> = {
  canvas: {
    title: '系统正在整理你的订单草案',
    detail:
      'We are validating connector choices, wire paths, and the fixed-syntax canvas summary.',
    etaLabel: 'Estimated processing time: 2 to 4 minutes',
    timeline: [
      { stage: 'Canvas objects captured', time: 'Now', state: 'done' },
      {
        stage: 'Connection rules reviewed',
        time: 'About 30 seconds',
        state: 'active',
      },
      {
        stage: 'Quote summary packaged',
        time: 'About 2 minutes',
        state: 'upcoming',
      },
      {
        stage: 'Draft order prepared',
        time: 'About 4 minutes',
        state: 'upcoming',
      },
    ],
    jobs: [
      {
        title: 'Connector family check',
        owner: 'Canvas validator',
        detail: 'Ensuring connector blocks and pin counts are internally consistent.',
      },
      {
        title: 'Wire path packaging',
        owner: 'Quote builder',
        detail: 'Summarizing wire objects into a mock pricing package.',
      },
      {
        title: 'Prototype handoff card',
        owner: 'Order assembler',
        detail: 'Preparing the front-end order draft for review.',
      },
    ],
  },
  upload: {
    title: '系统正在整理你的订单草案',
    detail:
      'We are turning the uploaded request into a structured prototype order draft.',
    etaLabel: 'Estimated processing time: 3 to 5 minutes',
    timeline: [
      { stage: 'Request form captured', time: 'Now', state: 'done' },
      {
        stage: 'Attachment placeholders indexed',
        time: 'About 45 seconds',
        state: 'active',
      },
      {
        stage: 'Scope summary generated',
        time: 'About 2 minutes',
        state: 'upcoming',
      },
      {
        stage: 'Draft order prepared',
        time: 'About 5 minutes',
        state: 'upcoming',
      },
    ],
    jobs: [
      {
        title: 'Request normalization',
        owner: 'Intake parser',
        detail: 'Converting the lightweight upload form into a common order summary.',
      },
      {
        title: 'Attachment placeholder review',
        owner: 'Assistant mock',
        detail: 'Tracking which placeholders will inform the quote review.',
      },
      {
        title: 'Prototype quote seed',
        owner: 'Order assembler',
        detail: 'Creating a first-pass front-end estimate for the draft order.',
      },
    ],
  },
};
