import { type FormEvent, useState } from 'react';
import {
  awgOptions,
  connectorFamilyOptions,
  connectorPinOptions,
} from '../../data/canvasCatalog';
import type { ConnectorDraftInput, ConnectorZone } from '../../types/prototype';

type ConnectorBuilderFormProps = {
  onAdd: (input: ConnectorDraftInput) => void;
};

export function ConnectorBuilderForm({ onAdd }: ConnectorBuilderFormProps) {
  const [zone, setZone] = useState<ConnectorZone>('left');
  const [label, setLabel] = useState('');
  const [family, setFamily] = useState(connectorFamilyOptions[0]);
  const [pins, setPins] = useState(connectorPinOptions[1]);
  const [optionsText, setOptionsText] = useState('sealed, keyed');
  const [awg, setAwg] = useState(awgOptions[1]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onAdd({
      zone,
      label,
      family,
      pins,
      options: optionsText
        .split(',')
        .map((option) => option.trim())
        .filter(Boolean),
      awg,
    });

    setLabel('');
  }

  return (
    <form className="builder-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <label className="field">
          <span>Zone</span>
          <select value={zone} onChange={(event) => setZone(event.target.value as ConnectorZone)}>
            <option value="left">Left connector zone</option>
            <option value="right">Right connector zone</option>
          </select>
        </label>
        <label className="field">
          <span>Pin count</span>
          <select
            value={pins}
            onChange={(event) => setPins(Number(event.target.value))}
          >
            {connectorPinOptions.map((pinOption) => (
              <option key={pinOption} value={pinOption}>
                {pinOption}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Label / ID</span>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Example: J1-PWR"
        />
      </label>
      <p className="helper-copy">
        Tip: leave the label blank only if you want to keep this connector in an incomplete draft state.
      </p>

      <div className="field-row">
        <label className="field">
          <span>Family</span>
          <select
            value={family}
            onChange={(event) => setFamily(event.target.value)}
          >
            {connectorFamilyOptions.map((familyOption) => (
              <option key={familyOption} value={familyOption}>
                {familyOption}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>AWG</span>
          <select value={awg} onChange={(event) => setAwg(event.target.value)}>
            {awgOptions.map((awgOption) => (
              <option key={awgOption} value={awgOption}>
                {awgOption}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Options</span>
        <input
          value={optionsText}
          onChange={(event) => setOptionsText(event.target.value)}
          placeholder="sealed, keyed, locking tab"
        />
      </label>
      <p className="helper-copy">
        If you cannot find the right family or option set in this V1 subset, use Upload / Assisted Request instead.
      </p>

      <button type="submit" className="button button-secondary">
        Add connector block
      </button>
    </form>
  );
}
