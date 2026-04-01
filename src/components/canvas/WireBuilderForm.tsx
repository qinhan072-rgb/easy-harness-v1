import { type FormEvent, useEffect, useState } from 'react';
import {
  awgOptions,
  wireColorOptions,
  wireTypeOptions,
} from '../../data/canvasCatalog';
import type { CanvasNode, WireConnectionInput } from '../../types/prototype';
import { getNodeConnectionPoints } from '../../utils/prototypeBuilders';

type WireBuilderFormProps = {
  nodes: CanvasNode[];
  onAdd: (input: WireConnectionInput) => void;
};

export function WireBuilderForm({ nodes, onAdd }: WireBuilderFormProps) {
  const [fromNodeId, setFromNodeId] = useState('');
  const [toNodeId, setToNodeId] = useState('');
  const [fromPin, setFromPin] = useState('');
  const [toPin, setToPin] = useState('');
  const [length, setLength] = useState(250);
  const [wireType, setWireType] = useState(wireTypeOptions[0]);
  const [wireGauge, setWireGauge] = useState(awgOptions[1]);
  const [wireColor, setWireColor] = useState(wireColorOptions[0]);

  const fromNode = nodes.find((node) => node.id === fromNodeId);
  const toNode = nodes.find((node) => node.id === toNodeId);
  const fromPins = fromNode ? getNodeConnectionPoints(fromNode) : [];
  const toPins = toNode ? getNodeConnectionPoints(toNode) : [];

  useEffect(() => {
    if (nodes.length === 0) {
      setFromNodeId('');
      setToNodeId('');
      return;
    }

    if (!nodes.some((node) => node.id === fromNodeId)) {
      setFromNodeId(nodes[0].id);
    }
  }, [nodes, fromNodeId]);

  useEffect(() => {
    const fallbackTarget = nodes.find((node) => node.id !== fromNodeId);

    if (!fallbackTarget) {
      setToNodeId('');
      return;
    }

    if (toNodeId === fromNodeId || !nodes.some((node) => node.id === toNodeId)) {
      setToNodeId(fallbackTarget.id);
    }
  }, [nodes, fromNodeId, toNodeId]);

  useEffect(() => {
    if (fromPins.length === 0) {
      setFromPin('');
      return;
    }

    if (!fromPins.includes(fromPin)) {
      setFromPin(fromPins[0]);
    }
  }, [fromPins, fromPin]);

  useEffect(() => {
    if (toPins.length === 0) {
      setToPin('');
      return;
    }

    if (!toPins.includes(toPin)) {
      setToPin(toPins[0]);
    }
  }, [toPins, toPin]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fromNodeId || !toNodeId || !fromPin || !toPin) {
      return;
    }

    onAdd({
      fromNodeId,
      toNodeId,
      fromPin,
      toPin,
      length,
      wireType,
      wireGauge,
      wireColor,
    });
  }

  return (
    <form className="builder-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <label className="field">
          <span>From block</span>
          <select
            value={fromNodeId}
            onChange={(event) => setFromNodeId(event.target.value)}
            disabled={nodes.length < 2}
          >
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>From pin</span>
          <select
            value={fromPin}
            onChange={(event) => setFromPin(event.target.value)}
            disabled={fromPins.length === 0}
          >
            {fromPins.map((pin) => (
              <option key={pin} value={pin}>
                {pin}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>To block</span>
          <select
            value={toNodeId}
            onChange={(event) => setToNodeId(event.target.value)}
            disabled={nodes.length < 2}
          >
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>To pin</span>
          <select
            value={toPin}
            onChange={(event) => setToPin(event.target.value)}
            disabled={toPins.length === 0}
          >
            {toPins.map((pin) => (
              <option key={pin} value={pin}>
                {pin}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Length (mm)</span>
          <input
            type="number"
            min={1}
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
          />
        </label>
        <label className="field">
          <span>Wire type</span>
          <select
            value={wireType}
            onChange={(event) => setWireType(event.target.value)}
          >
            {wireTypeOptions.map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {typeOption}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Gauge</span>
          <select
            value={wireGauge}
            onChange={(event) => setWireGauge(event.target.value)}
          >
            {awgOptions.map((awgOption) => (
              <option key={awgOption} value={awgOption}>
                {awgOption}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Color</span>
          <select
            value={wireColor}
            onChange={(event) => setWireColor(event.target.value)}
          >
            {wireColorOptions.map((colorOption) => (
              <option key={colorOption} value={colorOption}>
                {colorOption}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="helper-copy">
        V1 rule: wire connections must flow left to right across the fixed syntax canvas.
      </p>

      <button
        type="submit"
        className="button button-secondary"
        disabled={nodes.length < 2}
      >
        Add wire connection
      </button>
    </form>
  );
}
