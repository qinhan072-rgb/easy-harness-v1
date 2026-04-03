import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { leadTimePreferenceOptions } from '../data/uploadDrafts';
import type { LeadTimePreference } from '../types/prototype';
import { createAiRequest } from '../utils/requestApi';
import { useRequestSession } from '../context/RequestSessionContext';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

type DraftState = {
  requestTitle: string;
  conversationSummary: string;
  structuredSummary: string;
  quantity: number | null;
  leadTimePreference: LeadTimePreference | null;
  knownEndpoints: string[];
  intendedUse: string;
  environment: string;
  targetLength: string;
  missingDetails: string[];
  configuratorEligible: boolean;
  canCreateRequest: boolean;
};

const starterPrompts = [
  'Connect a controller to two sensors',
  'Add photos of the connectors',
  'Outdoor sealed harness',
  'I know the function, not the part numbers',
];

const initialAssistantMessage =
  'Describe the harness request in plain language. Include the connection need, endpoints, quantity, target length or routing allowance, operating environment, and any reference files available.';

const leadTimeLabels: Record<LeadTimePreference, string> = Object.fromEntries(
  leadTimePreferenceOptions.map((option) => [option.value, option.label]),
) as Record<LeadTimePreference, string>;

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (token) => {
    const normalized = token.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  });
}

function normalizeEndpointLabel(value: string) {
  const cleaned = value
    .replace(/\b(a|an|the|one|two|three|four|five|pair of|set of)\b/gi, ' ')
    .replace(/\bwith\b.*$/i, ' ')
    .replace(/[.,;:()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return '';
  }

  return toTitleCase(cleaned);
}

function extractQuantity(text: string) {
  const patterns = [
    /(?:qty|quantity)\s*(?:is|:)?\s*(\d+)/i,
    /(\d+)\s*(?:harness(?:es)?|assembl(?:y|ies)|loom(?:s)?|units?|sets?|pieces?)/i,
    /order\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

function extractLeadTime(text: string): LeadTimePreference | null {
  if (/\b(expedite|expedited|urgent|rush|asap|fast turnaround)\b/i.test(text)) {
    return 'expedite';
  }

  if (/\b(flexible|no rush|open timing|schedule can move)\b/i.test(text)) {
    return 'flexible';
  }

  if (/\b(standard|normal lead time|normal timing)\b/i.test(text)) {
    return 'standard';
  }

  return null;
}

function extractTargetLength(text: string) {
  const match = text.match(
    /\b(\d+(?:\.\d+)?)\s?(mm|cm|m|meter|meters|metre|metres|in|inch|inches|ft|feet)\b/i,
  );

  if (!match) {
    return '';
  }

  return `${match[1]} ${match[2]}`;
}

function extractEnvironment(text: string) {
  const environmentSignals = [
    { pattern: /\boutdoor|external|field\b/i, label: 'Outdoor use' },
    { pattern: /\bsealed|waterproof|wet|washdown\b/i, label: 'Sealed environment' },
    { pattern: /\bindoor|panel|cabinet\b/i, label: 'Indoor installation' },
    { pattern: /\bengine bay|high temperature|heat\b/i, label: 'High-temperature environment' },
    { pattern: /\bvibration|mobile|vehicle\b/i, label: 'Vibration exposure' },
  ];

  const matches = environmentSignals
    .filter((signal) => signal.pattern.test(text))
    .map((signal) => signal.label);

  return matches.join(', ');
}

function extractIntendedUse(text: string) {
  if (/\btest bench|bench|test rig\b/i.test(text)) {
    return 'Test bench harness';
  }

  if (/\bsensor\b/i.test(text) && /\bcontroller|ecu|pcb\b/i.test(text)) {
    return 'Controller-to-sensor connection';
  }

  if (/\bpanel|cabinet\b/i.test(text)) {
    return 'Panel connection';
  }

  if (/\bbattery|power\b/i.test(text)) {
    return 'Power distribution harness';
  }

  return '';
}

function extractEndpoints(text: string) {
  const endpoints: string[] = [];
  const directPatterns = [
    /connect(?:ing)?\s+(.+?)\s+to\s+(.+?)(?:[.;,\n]|$)/i,
    /from\s+(.+?)\s+to\s+(.+?)(?:[.;,\n]|$)/i,
  ];

  for (const pattern of directPatterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    const left = normalizeEndpointLabel(match[1]);
    const right = normalizeEndpointLabel(match[2]);

    if (left) {
      endpoints.push(left);
    }

    if (right) {
      endpoints.push(right);
    }
  }

  if (endpoints.length === 0) {
    const keywordPatterns = [
      { pattern: /\bcontroller\b/i, label: 'Controller' },
      { pattern: /\bsensor(?:s)?\b/i, label: 'Sensor' },
      { pattern: /\bactuator(?:s)?\b/i, label: 'Actuator' },
      { pattern: /\bbattery\b/i, label: 'Battery' },
      { pattern: /\bmotor\b/i, label: 'Motor' },
      { pattern: /\bdisplay\b/i, label: 'Display' },
      { pattern: /\bpower supply\b/i, label: 'Power supply' },
      { pattern: /\bpanel\b/i, label: 'Panel' },
    ];

    keywordPatterns.forEach((entry) => {
      if (entry.pattern.test(text)) {
        endpoints.push(entry.label);
      }
    });
  }

  return Array.from(new Set(endpoints)).slice(0, 3);
}

function buildStructuredSummary(
  draft: Omit<DraftState, 'missingDetails' | 'configuratorEligible' | 'canCreateRequest'>,
  attachmentCount: number,
) {
  if (!draft.conversationSummary) {
    return '';
  }

  const segments: string[] = [];

  if (draft.knownEndpoints.length >= 2) {
    segments.push(
      `Connect ${draft.knownEndpoints[0]} to ${draft.knownEndpoints[1]}.`,
    );
  } else if (draft.knownEndpoints.length === 1) {
    segments.push(`Connection includes ${draft.knownEndpoints[0]}.`);
  }

  if (draft.quantity) {
    segments.push(`Quantity ${draft.quantity}.`);
  }

  if (draft.targetLength) {
    segments.push(`Target length ${draft.targetLength}.`);
  }

  if (draft.environment) {
    segments.push(`Environment ${draft.environment}.`);
  }

  if (draft.intendedUse) {
    segments.push(`Use ${draft.intendedUse}.`);
  }

  if (attachmentCount > 0) {
    segments.push(`${attachmentCount} reference file(s) attached.`);
  }

  return segments.join(' ');
}

function buildDraft(userMessages: string[], files: File[]): DraftState {
  const conversationSummary = userMessages.join('\n').trim();
  const combinedText = conversationSummary.toLowerCase();
  const quantity = extractQuantity(conversationSummary);
  const leadTimePreference = extractLeadTime(conversationSummary);
  const targetLength = extractTargetLength(conversationSummary);
  const environment = extractEnvironment(conversationSummary);
  const intendedUse = extractIntendedUse(conversationSummary);
  const knownEndpoints = extractEndpoints(conversationSummary);
  const branchingMarkers =
    /\b(branch|split|splice|junction|fan out|multiple endpoints|three|four|two sensors)\b/i;
  const configuratorEligible =
    knownEndpoints.length === 2 && !branchingMarkers.test(combinedText);
  const requestTitle =
    knownEndpoints.length >= 2
      ? `${knownEndpoints[0]} to ${knownEndpoints[1]} harness`
      : intendedUse || 'Custom harness request';

  const baseDraft = {
    requestTitle,
    conversationSummary,
    structuredSummary: '',
    quantity,
    leadTimePreference,
    knownEndpoints,
    intendedUse,
    environment,
    targetLength,
  };

  const missingDetails: string[] = [];

  if (!conversationSummary) {
    missingDetails.push('Describe the main connection need');
  }

  if (quantity === null) {
    missingDetails.push('Missing quantity');
  }

  if (knownEndpoints.length < 2) {
    missingDetails.push('Missing endpoint details');
  }

  if (!/\b(deutsch|molex|jst|m12|connector|part number|terminal)\b/i.test(combinedText)) {
    missingDetails.push('Missing connector details');
  }

  if (!targetLength) {
    missingDetails.push('Missing target length');
  }

  if (!environment) {
    missingDetails.push('Missing environment constraints');
  }

  const canCreateRequest =
    conversationSummary.length > 12 && quantity !== null && knownEndpoints.length >= 2;

  return {
    ...baseDraft,
    structuredSummary: buildStructuredSummary(baseDraft, files.length),
    missingDetails,
    configuratorEligible,
    canCreateRequest,
  };
}

function buildAssistantReply(draft: DraftState, addedFilesCount = 0) {
  if (addedFilesCount > 0) {
    if (!draft.conversationSummary) {
      return `Added ${addedFilesCount} reference file(s). Please describe the connection need so I can organize the intake record.`;
    }

    return `Added ${addedFilesCount} reference file(s). I will include them with the intake record while the draft continues to form.`;
  }

  if (!draft.conversationSummary) {
    return initialAssistantMessage;
  }

  if (draft.quantity === null) {
    return 'What quantity should be quoted for this harness?';
  }

  if (draft.knownEndpoints.length < 2) {
    return 'Please identify the two main endpoints or devices that need to be connected.';
  }

  if (!draft.targetLength) {
    return 'What target length or routing allowance should be used for this harness?';
  }

  if (!draft.environment) {
    return 'What operating environment should be assumed for sealing, routing, or material selection?';
  }

  return 'The intake draft is clear enough to proceed. Review the live draft on the right and create the intake request when you are ready.';
}

export function AIAgentPage() {
  const navigate = useNavigate();
  const { setActiveRequestId } = useRequestSession();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createMessageId('assistant'),
      role: 'assistant',
      text: initialAssistantMessage,
    },
  ]);
  const [composer, setComposer] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const userMessages = useMemo(
    () => messages.filter((message) => message.role === 'user').map((message) => message.text),
    [messages],
  );
  const draft = useMemo(
    () => buildDraft(userMessages, selectedFiles),
    [userMessages, selectedFiles],
  );

  useEffect(() => {
    if (!threadRef.current) {
      return;
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  function appendConversation(nextUserText: string) {
    const trimmed = nextUserText.trim();

    if (!trimmed) {
      return;
    }

    const nextUserMessages = [...userMessages, trimmed];
    const nextDraft = buildDraft(nextUserMessages, selectedFiles);
    const assistantReply = buildAssistantReply(nextDraft);

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createMessageId('user'),
        role: 'user',
        text: trimmed,
      },
      {
        id: createMessageId('assistant'),
        role: 'assistant',
        text: assistantReply,
      },
    ]);
    setComposer('');
    setFeedback(null);
  }

  function handleStarterPrompt(prompt: string) {
    appendConversation(prompt);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      appendConversation(composer);
    }
  }

  function handleSelectFiles(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []);

    if (nextFiles.length === 0) {
      return;
    }

    const combinedFiles = [...selectedFiles, ...nextFiles];
    const nextDraft = buildDraft(userMessages, combinedFiles);
    const assistantReply = buildAssistantReply(nextDraft, nextFiles.length);

    setSelectedFiles(combinedFiles);
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createMessageId('assistant'),
        role: 'assistant',
        text: assistantReply,
      },
    ]);
    setFeedback(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleCreateRequest() {
    if (!draft.canCreateRequest) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('projectName', draft.requestTitle);
    formData.append('requestSummary', draft.conversationSummary);
    formData.append('draftSummary', draft.structuredSummary);
    formData.append('quantity', String(draft.quantity ?? 1));
    formData.append('leadTimePreference', draft.leadTimePreference ?? 'standard');
    formData.append('intendedUse', draft.intendedUse);
    formData.append(
      'environmentNotes',
      [
        draft.environment ? `Environment: ${draft.environment}` : '',
        draft.targetLength ? `Target length: ${draft.targetLength}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
    formData.append('missingInfo', JSON.stringify(draft.missingDetails));

    selectedFiles.forEach((file) => {
      formData.append('attachments', file);
    });

    try {
      const request = await createAiRequest(formData);
      setActiveRequestId(request.id);
      navigate(`/processing/${request.id}`);
    } catch (submitError) {
      setFeedback(
        submitError instanceof Error
          ? submitError.message
          : 'We could not create the intake request.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const nextStepGuidance = draft.canCreateRequest
    ? 'The intake draft is clear enough to submit.'
    : draft.missingDetails.length > 0
      ? `Add the remaining details: ${draft.missingDetails.join(', ')}.`
      : 'Describe the request to begin the intake draft.';

  return (
    <div className="page-stack">
      <section className="ai-workspace">
        <article className="panel ai-chat-panel">
          <div className="ai-chat-header">
            <span className="eyebrow">Primary intake</span>
            <h1>AI Agent</h1>
            <p>
              Describe the harness request in plain language. Add files if they help
              clarify the job.
            </p>
          </div>

          <div className="ai-thread" ref={threadRef}>
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`ai-message ai-message--${message.role}`}
              >
                <span className="ai-message__label">
                  {message.role === 'assistant' ? 'Easy Harness' : 'You'}
                </span>
                <p>{message.text}</p>
                {index === 0 ? (
                  <div className="ai-starter-row">
                    {starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="tag-button ai-starter-chip"
                        onClick={() => handleStarterPrompt(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="ai-input-bar">
            <div className="ai-input-shell">
              <textarea
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Describe the connection need, quantity, target length, environment, or known connector details."
                rows={2}
              />
            </div>
            <div className="ai-input-actions">
              <input
                ref={fileInputRef}
                className="ai-file-input"
                type="file"
                multiple
                onChange={handleSelectFiles}
              />
              <button
                type="button"
                className="button button-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Add Files
              </button>
              <button
                type="button"
                className="button"
                disabled={!composer.trim()}
                onClick={() => appendConversation(composer)}
              >
                Send
              </button>
            </div>
          </div>
        </article>

        <aside className="panel ai-draft-panel">
          <div className="panel-heading">
            <h3>Current Draft</h3>
            <p>The request draft updates as the intake record becomes clearer.</p>
          </div>

          <div className="ai-draft-grid">
            <div className="ai-draft-field">
              <span>Request title</span>
              <strong>{draft.requestTitle}</strong>
            </div>
            <div className="ai-draft-field">
              <span>Quantity</span>
              <strong>{draft.quantity ?? 'Not set'}</strong>
            </div>
            <div className="ai-draft-field">
              <span>Target lead time</span>
              <strong>
                {draft.leadTimePreference
                  ? leadTimeLabels[draft.leadTimePreference]
                  : 'Not set'}
              </strong>
            </div>
            <div className="ai-draft-field">
              <span>Known endpoints</span>
              <strong>
                {draft.knownEndpoints.length > 0
                  ? draft.knownEndpoints.join(' / ')
                  : 'Still gathering'}
              </strong>
            </div>
            <div className="ai-draft-field">
              <span>Intended use</span>
              <strong>{draft.intendedUse || 'Not set'}</strong>
            </div>
            <div className="ai-draft-field">
              <span>Environment</span>
              <strong>{draft.environment || 'Not set'}</strong>
            </div>
            <div className="ai-draft-field ai-draft-field--wide">
              <span>Attachments</span>
              {selectedFiles.length === 0 ? (
                <strong>No files attached</strong>
              ) : (
                <div className="ai-attachment-list">
                  {selectedFiles.map((file) => (
                    <span key={`${file.name}-${file.size}`} className="ai-attachment-pill">
                      {file.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="ai-draft-field ai-draft-field--wide">
              <span>Structured summary</span>
              <p>{draft.structuredSummary || 'The draft summary will appear as details are provided.'}</p>
            </div>
          </div>

          <div className="ai-draft-section">
            <div className="panel-heading">
              <h3>Missing Details</h3>
              <p>Open points that still need clarification.</p>
            </div>
            <ul className="simple-list">
              {draft.missingDetails.length === 0 ? (
                <li>No blocking details are currently open.</li>
              ) : (
                draft.missingDetails.map((item) => <li key={item}>{item}</li>)
              )}
            </ul>
          </div>

          <div className="ai-draft-section ai-draft-section--next-step">
            <div className="panel-heading">
              <h3>Next Step</h3>
              <p>{nextStepGuidance}</p>
            </div>

            {feedback ? (
              <div className="info-banner info-banner--error">{feedback}</div>
            ) : null}

            {draft.canCreateRequest ? (
              <div className="ai-next-step-actions">
                <button
                  type="button"
                  className="button"
                  disabled={isSubmitting}
                  onClick={() => void handleCreateRequest()}
                >
                  {isSubmitting ? 'Creating intake request...' : 'Create Intake Request'}
                </button>
                {draft.configuratorEligible ? (
                  <Link to="/configurator" className="button button-secondary">
                    Continue in Configurator
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="info-banner info-banner--subtle">
                Continue the conversation until the request draft is clear enough to submit.
              </div>
            )}

            <p className="ai-note">
              Early access: some requests may still be finalized with internal review
              before quotation.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
