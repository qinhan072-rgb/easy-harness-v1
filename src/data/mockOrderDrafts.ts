import type {
  FlowSource,
  OrderDraftStatus,
  ProcessingInfo,
} from '../types/prototype';

export const sourceTypeLabels: Record<FlowSource, string> = {
  canvas: 'Canvas-Assisted Ordering',
  upload: 'Upload-Assisted Intake',
};

export const orderStatusCopy: Record<
  OrderDraftStatus,
  { label: string; description: string }
> = {
  draft: {
    label: 'Draft ready',
    description: 'Standardized draft boundary prepared for review.',
  },
  confirmed: {
    label: 'Draft confirmed',
    description: 'The current draft boundary has been accepted in this prototype.',
  },
  'changes-requested': {
    label: 'Changes requested',
    description:
      'The draft needs updates before it should move closer to order acceptance.',
  },
};

export const processingTemplates: Record<FlowSource, ProcessingInfo> = {
  canvas: {
    title: '系统正在整理你的订单草案',
    detail:
      'Easy Harness is standardizing your canvas-assisted setup into an orderable harness draft.',
    etaLabel: 'Estimated processing time: 2 to 4 minutes',
    timeline: [
      { stage: 'Canvas structure captured', time: 'Now', state: 'done' },
      {
        stage: 'Order boundary reviewed',
        time: 'About 30 seconds',
        state: 'active',
      },
      {
        stage: 'Draft summary packaged',
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
        title: 'Structured canvas review',
        owner: 'Canvas order boundary',
        detail: 'Checking whether the current setup fits the narrow orderable canvas path.',
      },
      {
        title: 'Wire path standardization',
        owner: 'Draft preparation',
        detail: 'Turning the defined wire path into a standardized draft summary.',
      },
      {
        title: 'Order draft assembly',
        owner: 'Order assembler',
        detail: 'Preparing the shared order draft for review and confirmation.',
      },
    ],
  },
  upload: {
    title: '系统正在整理你的订单草案',
    detail:
      'Easy Harness is turning your references and notes into a standardized order draft.',
    etaLabel: 'Estimated processing time: 3 to 5 minutes',
    timeline: [
      { stage: 'Request summary captured', time: 'Now', state: 'done' },
      {
        stage: 'Reference set indexed',
        time: 'About 45 seconds',
        state: 'active',
      },
      {
        stage: 'Assisted draft summary generated',
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
        title: 'Reference normalization',
        owner: 'Intake parser',
        detail: 'Converting uploaded request context into the shared order draft structure.',
      },
      {
        title: 'Reference review',
        owner: 'AI + human review',
        detail: 'Tracking which uploaded materials will shape the draft boundary.',
      },
      {
        title: 'Assisted draft seed',
        owner: 'Order assembler',
        detail: 'Creating the first standardized draft package for order review.',
      },
    ],
  },
};
