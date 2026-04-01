import type { UploadDraft } from '../types/prototype';

export const leadTimePreferenceOptions = [
  {
    value: 'standard',
    label: 'Standard',
    hint: 'Best for a normal prototype review cycle.',
  },
  {
    value: 'expedite',
    label: 'Expedite',
    hint: 'Use when the prototype build needs faster turnaround.',
  },
  {
    value: 'flexible',
    label: 'Flexible',
    hint: 'Use when schedule can be tuned after engineering review.',
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
