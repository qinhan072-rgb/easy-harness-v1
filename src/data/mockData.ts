export const navItems = [
  { label: 'Home', path: '/' },
  { label: 'AI Agent', path: '/ai-agent' },
  { label: 'Configurator', path: '/configurator' },
  { label: 'Upload Intake', path: '/upload' },
  { label: 'Request Status', path: '/processing' },
  { label: 'Order Draft', path: '/order-confirmation' },
];

export const overviewMetrics = [
  { label: 'Draft harnesses', value: '12', hint: '+3 this week' },
  { label: 'Active requests', value: '8', hint: '2 awaiting review' },
  { label: 'Average cycle', value: '36h', hint: 'Prototype SLA' },
  { label: 'Ready to order', value: '5', hint: '2 high-priority' },
];

export const harnessModules = [
  { id: 'MCU', title: 'Controller', status: 'Validated', detail: '24-pin logic connector with CAN breakout' },
  { id: 'PWR', title: 'Power leg', status: 'Needs review', detail: 'Shielded dual-core lead for 48V line' },
  { id: 'SNS', title: 'Sensor block', status: 'Ready', detail: 'Branching loom with keyed locking terminals' },
  { id: 'ACT', title: 'Actuator leg', status: 'Draft', detail: 'Two motor outputs with strain relief' },
];

export const canvasStages = [
  { title: 'Input mapping', detail: 'Pin map and connector families are preloaded from template EH-104.' },
  { title: 'Routing preview', detail: 'Segment lengths are estimated against the latest enclosure envelope.' },
  { title: 'Validation gates', detail: 'Bend radius, voltage separation, and bundle occupancy are simulated.' },
];

export const uploadSources = [
  { name: 'BOM.xlsx', type: 'Spreadsheet', status: 'Parsed', note: '14 line items matched known parts.' },
  { name: 'Harness sketch.pdf', type: 'Drawing', status: 'Needs OCR', note: '3 callouts need manual confirmation.' },
  { name: 'Customer brief.txt', type: 'Text', status: 'Accepted', note: 'Priority request marked as expedited.' },
];

export const assistantPrompts = [
  'Need a 48V harness for a compact test rig with one controller, two sensors, and dual actuator outputs.',
  'Preserve the existing bulkhead connector but update downstream branch lengths based on a smaller frame.',
  'Highlight any part substitutions that would simplify assembly for a first prototype build.',
];

export const processingTimeline = [
  { stage: 'Files ingested', time: '09:10', state: 'done' },
  { stage: 'Schema normalization', time: '09:18', state: 'done' },
  { stage: 'Constraint checks', time: '09:26', state: 'active' },
  { stage: 'Quote packaging', time: 'Pending', state: 'upcoming' },
  { stage: 'Order handoff', time: 'Pending', state: 'upcoming' },
] as const;

export const processingJobs = [
  { title: 'Material compatibility', owner: 'Rules engine', detail: 'Comparing insulation, gauge, and voltage class.' },
  { title: 'Missing dimensions', owner: 'Assistant', detail: 'Flagging 2 branch lengths for manual confirmation.' },
  { title: 'Prototype routing pack', owner: 'Configurator', detail: 'Generating first-pass routing sheet and bundle summary.' },
];

export const orderSummary = {
  orderId: 'EHV1-24031',
  customer: 'Prototype Lab A',
  eta: '2 business days',
  total: '$4,860',
  notes: 'Prototype build includes assembly notes, labeling sheet, and a first-article checklist.',
};

export const orderLineItems = [
  { label: 'Primary harness assembly', value: '$3,400' },
  { label: 'Connector kit & terminals', value: '$860' },
  { label: 'Labeling and test pack', value: '$300' },
  { label: 'Expedite handling', value: '$300' },
];

export const nextActions = [
  'Share the generated routing pack with the electrical reviewer.',
  'Confirm the two missing branch dimensions before release.',
  'Approve prototype spend to hand the order into fabrication.',
];
