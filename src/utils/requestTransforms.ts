import { midElementCatalog } from '../data/canvasCatalog';
import type { CanvasDraft } from '../types/prototype';
import { getCanvasNodeById } from './prototypeBuilders';

export function buildCanvasKnownConnectors(draft: CanvasDraft) {
  return draft.connectors.map(
    (connector) =>
      `${connector.label} | ${connector.family} | ${connector.pins} pins | ${connector.awg}`,
  );
}

export function buildCanvasKnownElements(draft: CanvasDraft) {
  return draft.midElements.map(
    (element) =>
      `${element.label} | ${midElementCatalog[element.type].label} | column ${element.column}`,
  );
}

export function buildCanvasKnownWires(draft: CanvasDraft) {
  return draft.wires.map((wire) => {
    const fromNode = getCanvasNodeById(draft, wire.fromNodeId);
    const toNode = getCanvasNodeById(draft, wire.toNodeId);

    return `${fromNode?.label ?? 'Unknown'}:${wire.fromPin} -> ${
      toNode?.label ?? 'Unknown'
    }:${wire.toPin} | ${wire.length} mm | ${wire.wireType} | ${
      wire.wireGauge
    } | ${wire.wireColor}`;
  });
}

export function buildCanvasRequestSummary(draft: CanvasDraft) {
  return `Structured canvas request with ${draft.connectors.length} connectors, ${draft.midElements.length} mid elements, and ${draft.wires.length} wires.`;
}

export function buildCanvasAssumptions() {
  return [
    'This request was submitted through the bounded structured canvas path.',
  ];
}

export function buildCanvasMissingInfo() {
  return [
    'Part numbers, drawings, and downstream manufacturing notes may still need review.',
  ];
}
