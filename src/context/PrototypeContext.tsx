import {
  createContext,
  type ReactNode,
  useContext,
  useReducer,
} from 'react';
import {
  awgOptions,
  connectorPinOptions,
  initialCanvasDraft,
  midElementCatalog,
} from '../data/canvasCatalog';
import { initialUploadDraft } from '../data/uploadDrafts';
import type {
  CanvasDraft,
  CanvasNode,
  ConnectorCreateInput,
  ConnectorDraftInput,
  ConnectorUpdateInput,
  MidElementCreateInput,
  MidElementDraftInput,
  MidElementUpdateInput,
  OrderDraftStatus,
  PrototypeState,
  UploadDraft,
  WireConnectionInput,
  WireUpdateInput,
} from '../types/prototype';
import {
  createCanvasOrderDraft,
  createEntityId,
  createSampleValidCanvasDraft,
  createProcessingInfo,
  createUploadOrderDraft,
  evaluateCanvasDraft,
  getConnectorMissingFields,
  getMidElementMissingFields,
  getNodeTrack,
  validateWireConnection,
} from '../utils/prototypeBuilders';

type PrototypeContextValue = {
  state: PrototypeState;
  allCanvasNodes: CanvasNode[];
  canvasEvaluation: ReturnType<typeof evaluateCanvasDraft>;
  addConnector: (input: ConnectorDraftInput) => void;
  createConnector: (input: ConnectorCreateInput) => string;
  updateConnector: (id: string, input: ConnectorUpdateInput) => void;
  addMidElement: (input: MidElementDraftInput) => void;
  createMidElement: (input: MidElementCreateInput) => string;
  updateMidElement: (id: string, input: MidElementUpdateInput) => void;
  addWire: (input: WireConnectionInput) => { ok: boolean; message: string };
  updateWire: (id: string, input: WireUpdateInput) => void;
  setCanvasFeedback: (message: string) => void;
  loadSampleValidCanvas: () => void;
  submitCanvas: () => { ok: boolean; message: string };
  updateUploadField: <K extends keyof UploadDraft>(
    field: K,
    value: UploadDraft[K],
  ) => void;
  addAttachmentPlaceholder: (attachment: string) => void;
  removeAttachmentPlaceholder: (attachment: string) => void;
  submitUpload: () => { ok: boolean; message: string };
  setOrderStatus: (status: OrderDraftStatus) => void;
};

type Action =
  | {
      type: 'ADD_CONNECTOR';
      connector: PrototypeState['canvasDraft']['connectors'][number];
      message: string;
    }
  | {
      type: 'ADD_MID_ELEMENT';
      midElement: PrototypeState['canvasDraft']['midElements'][number];
      message: string;
    }
  | {
      type: 'UPDATE_CONNECTOR';
      connector: PrototypeState['canvasDraft']['connectors'][number];
      message: string;
    }
  | {
      type: 'UPDATE_MID_ELEMENT';
      midElement: PrototypeState['canvasDraft']['midElements'][number];
      message: string;
    }
  | {
      type: 'ADD_WIRE';
      wire: PrototypeState['canvasDraft']['wires'][number];
      message: string;
    }
  | {
      type: 'UPDATE_WIRE';
      wire: PrototypeState['canvasDraft']['wires'][number];
      message: string;
    }
  | { type: 'SET_CANVAS_DRAFT'; draft: CanvasDraft; message: string }
  | { type: 'SET_CANVAS_FEEDBACK'; message: string }
  | {
      type: 'UPDATE_UPLOAD_FIELD';
      field: keyof UploadDraft;
      value: UploadDraft[keyof UploadDraft];
    }
  | { type: 'ADD_ATTACHMENT'; attachment: string }
  | { type: 'REMOVE_ATTACHMENT'; attachment: string }
  | {
      type: 'SUBMIT_CANVAS';
      orderDraft: PrototypeState['orderDraft'];
      processingInfo: PrototypeState['processingInfo'];
      message: string;
    }
  | {
      type: 'SUBMIT_UPLOAD';
      orderDraft: PrototypeState['orderDraft'];
      processingInfo: PrototypeState['processingInfo'];
      message: string;
    }
  | { type: 'SET_UPLOAD_FEEDBACK'; message: string }
  | { type: 'SET_ORDER_STATUS'; status: OrderDraftStatus; message: string };

const initialState: PrototypeState = {
  canvasDraft: initialCanvasDraft,
  uploadDraft: initialUploadDraft,
  uploadFeedback: null,
  flowSource: null,
  processingInfo: null,
  orderDraft: null,
  orderFeedback: null,
};

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

function reducer(state: PrototypeState, action: Action): PrototypeState {
  switch (action.type) {
    case 'ADD_CONNECTOR':
      return {
        ...state,
        canvasDraft: {
          ...state.canvasDraft,
          connectors: [...state.canvasDraft.connectors, action.connector],
          lastFeedback: action.message,
        },
        orderFeedback: null,
      };
    case 'ADD_MID_ELEMENT':
      return {
        ...state,
        canvasDraft: {
          ...state.canvasDraft,
          midElements: [...state.canvasDraft.midElements, action.midElement],
          lastFeedback: action.message,
        },
        orderFeedback: null,
      };
    case 'UPDATE_CONNECTOR':
      return {
        ...state,
        canvasDraft: {
          ...state.canvasDraft,
          connectors: state.canvasDraft.connectors.map((connector) =>
            connector.id === action.connector.id ? action.connector : connector,
          ),
          lastFeedback: action.message,
        },
        orderFeedback: null,
      };
    case 'UPDATE_MID_ELEMENT':
      return {
        ...state,
        canvasDraft: {
          ...state.canvasDraft,
          midElements: state.canvasDraft.midElements.map((midElement) =>
            midElement.id === action.midElement.id ? action.midElement : midElement,
          ),
          lastFeedback: action.message,
        },
        orderFeedback: null,
      };
    case 'ADD_WIRE':
      return {
        ...state,
        canvasDraft: {
          ...state.canvasDraft,
          wires: [...state.canvasDraft.wires, action.wire],
          lastFeedback: action.message,
        },
        orderFeedback: null,
      };
    case 'UPDATE_WIRE':
      return {
        ...state,
        canvasDraft: {
          ...state.canvasDraft,
          wires: state.canvasDraft.wires.map((wire) =>
            wire.id === action.wire.id ? action.wire : wire,
          ),
          lastFeedback: action.message,
        },
        orderFeedback: null,
      };
    case 'SET_CANVAS_DRAFT':
      return {
        ...state,
        canvasDraft: {
          ...action.draft,
          lastFeedback: action.message,
        },
        orderFeedback: null,
      };
    case 'SET_CANVAS_FEEDBACK':
      return {
        ...state,
        canvasDraft: {
          ...state.canvasDraft,
          lastFeedback: action.message,
        },
      };
    case 'UPDATE_UPLOAD_FIELD':
      return {
        ...state,
        uploadDraft: {
          ...state.uploadDraft,
          [action.field]: action.value,
        },
        uploadFeedback: null,
        orderFeedback: null,
      };
    case 'ADD_ATTACHMENT':
      return state.uploadDraft.attachments.includes(action.attachment)
        ? {
            ...state,
            uploadFeedback: `${action.attachment} is already attached as a placeholder.`,
          }
        : {
            ...state,
            uploadDraft: {
              ...state.uploadDraft,
              attachments: [...state.uploadDraft.attachments, action.attachment],
            },
            uploadFeedback: `Added attachment placeholder: ${action.attachment}.`,
          };
    case 'REMOVE_ATTACHMENT':
      return {
        ...state,
        uploadDraft: {
          ...state.uploadDraft,
          attachments: state.uploadDraft.attachments.filter(
            (attachment) => attachment !== action.attachment,
          ),
        },
        uploadFeedback: `Removed attachment placeholder: ${action.attachment}.`,
      };
    case 'SUBMIT_CANVAS':
      return {
        ...state,
        flowSource: 'canvas',
        processingInfo: action.processingInfo,
        orderDraft: action.orderDraft,
        orderFeedback: action.message,
        canvasDraft: {
          ...state.canvasDraft,
          lastFeedback: action.message,
        },
      };
    case 'SUBMIT_UPLOAD':
      return {
        ...state,
        flowSource: 'upload',
        processingInfo: action.processingInfo,
        orderDraft: action.orderDraft,
        orderFeedback: action.message,
        uploadFeedback: action.message,
      };
    case 'SET_UPLOAD_FEEDBACK':
      return {
        ...state,
        uploadFeedback: action.message,
      };
    case 'SET_ORDER_STATUS':
      return state.orderDraft
        ? {
            ...state,
            orderDraft: {
              ...state.orderDraft,
              status: action.status,
            },
            orderFeedback: action.message,
          }
        : state;
    default:
      return state;
  }
}

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const canvasEvaluation = evaluateCanvasDraft(state.canvasDraft);
  const allCanvasNodes = [
    ...state.canvasDraft.connectors,
    ...state.canvasDraft.midElements,
  ].sort((left, right) => {
    const trackDelta = getNodeTrack(left) - getNodeTrack(right);

    if (trackDelta !== 0) {
      return trackDelta;
    }

    return left.label.localeCompare(right.label);
  });

  const value: PrototypeContextValue = {
    state,
    allCanvasNodes,
    canvasEvaluation,
    addConnector(input) {
      const missingFields = getConnectorMissingFields(input);
      const normalizedLabel = input.label.trim();
      const connector = {
        kind: 'connector' as const,
        id: createEntityId('connector'),
        label:
          normalizedLabel ||
          `Untitled ${input.zone} connector ${state.canvasDraft.connectors.length + 1}`,
        family: input.family,
        pins: input.pins,
        options: input.options,
        awg: input.awg,
        zone: input.zone,
        configurationState:
          missingFields.length === 0 ? ('configured' as const) : ('incomplete' as const),
        missingFields,
      };

      dispatch({
        type: 'ADD_CONNECTOR',
        connector,
        message:
          missingFields.length === 0
            ? `Added ${connector.zone} connector ${connector.label}.`
            : `Added ${connector.label}, but it still needs more details before order submission.`,
      });
    },
    createConnector(input) {
      const zoneCount =
        state.canvasDraft.connectors.filter(
          (connector) => connector.zone === input.zone,
        ).length + 1;
      const familyLabel = input.family.replace(/\s+/g, ' ').trim();
      const label = `${input.zone === 'left' ? 'Left' : 'Right'} ${familyLabel} ${zoneCount}`;
      const options: string[] = [];
      const connector = {
        kind: 'connector' as const,
        id: createEntityId('connector'),
        label,
        family: input.family,
        pins: connectorPinOptions[1] ?? connectorPinOptions[0] ?? 2,
        options,
        awg: awgOptions[1] ?? awgOptions[0] ?? '20 AWG',
        zone: input.zone,
        configurationState: 'incomplete' as const,
        missingFields: getConnectorMissingFields({ label, options }),
      };

      dispatch({
        type: 'ADD_CONNECTOR',
        connector,
        message: `Added ${label}. Configure it next inside the canvas workflow.`,
      });

      return connector.id;
    },
    updateConnector(id, input) {
      const existingConnector = state.canvasDraft.connectors.find(
        (connector) => connector.id === id,
      );

      if (!existingConnector) {
        return;
      }

      const label = input.label.trim() || existingConnector.label;
      const missingFields = getConnectorMissingFields({
        label,
        options: input.options,
      });
      const connector = {
        ...existingConnector,
        label,
        pins: input.pins,
        options: input.options,
        awg: input.awg,
        configurationState:
          missingFields.length === 0 ? ('configured' as const) : ('incomplete' as const),
        missingFields,
      };

      dispatch({
        type: 'UPDATE_CONNECTOR',
        connector,
        message:
          missingFields.length === 0
            ? `Updated ${connector.label}. It is ready inside the current canvas boundary.`
            : `Updated ${connector.label}. It still needs more details before order submission.`,
      });
    },
    addMidElement(input) {
      const catalogItem = midElementCatalog[input.type];
      const missingFields = getMidElementMissingFields(input);
      const normalizedLabel = input.label.trim();
      const midElement = {
        kind: 'mid-element' as const,
        id: createEntityId('mid'),
        label:
          normalizedLabel ||
          `Untitled ${catalogItem.label.toLowerCase()} ${state.canvasDraft.midElements.length + 1}`,
        type: input.type,
        column: input.column,
        detail: catalogItem.detail,
        ports: catalogItem.ports,
        configurationState:
          missingFields.length === 0 ? ('configured' as const) : ('incomplete' as const),
        missingFields,
      };

      dispatch({
        type: 'ADD_MID_ELEMENT',
        midElement,
        message:
          missingFields.length === 0
            ? `Added ${catalogItem.label.toLowerCase()} block to column ${input.column}.`
            : `Added ${midElement.label}, but it still needs more details before order submission.`,
      });
    },
    createMidElement(input) {
      const catalogItem = midElementCatalog[input.type];
      const columnCount =
        state.canvasDraft.midElements.filter(
          (midElement) => midElement.column === input.column,
        ).length + 1;
      const label = `${catalogItem.label} ${columnCount}`;
      const missingFields = getMidElementMissingFields({ label });
      const midElement = {
        kind: 'mid-element' as const,
        id: createEntityId('mid'),
        label,
        type: input.type,
        column: input.column,
        detail: catalogItem.detail,
        ports: catalogItem.ports,
        configurationState:
          missingFields.length === 0 ? ('configured' as const) : ('incomplete' as const),
        missingFields,
      };

      dispatch({
        type: 'ADD_MID_ELEMENT',
        midElement,
        message: `Added ${label}. Refine it from the canvas detail panel if needed.`,
      });

      return midElement.id;
    },
    updateMidElement(id, input) {
      const existingMidElement = state.canvasDraft.midElements.find(
        (midElement) => midElement.id === id,
      );

      if (!existingMidElement) {
        return;
      }

      const label = input.label.trim() || existingMidElement.label;
      const missingFields = getMidElementMissingFields({ label });
      const midElement = {
        ...existingMidElement,
        label,
        configurationState:
          missingFields.length === 0 ? ('configured' as const) : ('incomplete' as const),
        missingFields,
      };

      dispatch({
        type: 'UPDATE_MID_ELEMENT',
        midElement,
        message:
          missingFields.length === 0
            ? `Updated ${midElement.label}.`
            : `Updated ${midElement.label}. Add the missing details before submission.`,
      });
    },
    addWire(input) {
      const validationError = validateWireConnection(state.canvasDraft, input);

      if (validationError) {
        dispatch({ type: 'SET_CANVAS_FEEDBACK', message: validationError });

        return { ok: false, message: validationError };
      }

      const wire = {
        id: createEntityId('wire'),
        ...input,
      };

      dispatch({
        type: 'ADD_WIRE',
        wire,
        message: `Added wire from ${input.fromPin} to ${input.toPin}.`,
      });

      return { ok: true, message: 'Wire added.' };
    },
    updateWire(id, input) {
      const existingWire = state.canvasDraft.wires.find((wire) => wire.id === id);

      if (!existingWire) {
        return;
      }

      const wire = {
        ...existingWire,
        ...input,
      };

      dispatch({
        type: 'UPDATE_WIRE',
        wire,
        message: `Updated wire from ${wire.fromPin} to ${wire.toPin}.`,
      });
    },
    setCanvasFeedback(message) {
      dispatch({ type: 'SET_CANVAS_FEEDBACK', message });
    },
    loadSampleValidCanvas() {
      dispatch({
        type: 'SET_CANVAS_DRAFT',
        draft: createSampleValidCanvasDraft(),
        message: 'Loaded sample canvas.',
      });
    },
    submitCanvas() {
      if (!canvasEvaluation.canSubmit) {
        const message = canvasEvaluation.issues[0] ?? 'Canvas is not ready yet.';
        dispatch({ type: 'SET_CANVAS_FEEDBACK', message });

        return { ok: false, message };
      }

      const orderDraft = createCanvasOrderDraft(state.canvasDraft);
      const processingInfo = createProcessingInfo('canvas');
      const message = 'Canvas-assisted request submitted for draft preparation.';

      dispatch({
        type: 'SUBMIT_CANVAS',
        orderDraft,
        processingInfo,
        message,
      });

      return { ok: true, message };
    },
    updateUploadField(field, value) {
      dispatch({ type: 'UPDATE_UPLOAD_FIELD', field, value });
    },
    addAttachmentPlaceholder(attachment) {
      dispatch({ type: 'ADD_ATTACHMENT', attachment });
    },
    removeAttachmentPlaceholder(attachment) {
      dispatch({ type: 'REMOVE_ATTACHMENT', attachment });
    },
    submitUpload() {
      if (!state.uploadDraft.projectName.trim()) {
        const message = 'Project name is required before submitting.';
        dispatch({ type: 'SET_UPLOAD_FEEDBACK', message });

        return { ok: false, message };
      }

      if (!state.uploadDraft.description.trim()) {
        const message = 'Description is required before submitting.';
        dispatch({ type: 'SET_UPLOAD_FEEDBACK', message });

        return { ok: false, message };
      }

      if (state.uploadDraft.quantity < 1) {
        const message = 'Quantity must be at least 1.';
        dispatch({ type: 'SET_UPLOAD_FEEDBACK', message });

        return { ok: false, message };
      }

      const orderDraft = createUploadOrderDraft(state.uploadDraft);
      const processingInfo = createProcessingInfo('upload');
      const message = 'Upload-assisted request submitted for draft preparation.';

      dispatch({
        type: 'SUBMIT_UPLOAD',
        orderDraft,
        processingInfo,
        message,
      });

      return { ok: true, message };
    },
    setOrderStatus(status) {
      const message =
        status === 'confirmed'
          ? 'Draft confirmed. This validates the current draft boundary only; no real order was placed yet.'
          : 'Changes requested. Return to the intake path and revise the draft.';

      dispatch({ type: 'SET_ORDER_STATUS', status, message });
    },
  };

  return (
    <PrototypeContext.Provider value={value}>
      {children}
    </PrototypeContext.Provider>
  );
}

export function usePrototype() {
  const context = useContext(PrototypeContext);

  if (!context) {
    throw new Error('usePrototype must be used within PrototypeProvider.');
  }

  return context;
}
