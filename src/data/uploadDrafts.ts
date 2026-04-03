import type { UploadDraft } from '../types/prototype';

export const leadTimePreferenceOptions = [
  {
    value: 'standard',
    label: 'Standard',
    hint: 'Standard quotation schedule.',
  },
  {
    value: 'expedite',
    label: 'Expedite',
    hint: 'Shorter turnaround where capacity allows.',
  },
  {
    value: 'flexible',
    label: 'Flexible',
    hint: 'Timing can be aligned after intake review.',
  },
] as const;

export const attachmentPlaceholderOptions = [
  'BOM.xlsx',
  'Harness-Sketch.pdf',
  'Requirements-Notes.txt',
  'Pinout-Image.png',
];

export const initialUploadDraft: UploadDraft = {
  projectName: '',
  description: '',
  attachments: [],
  quantity: 1,
  leadTimePreference: 'standard',
};
