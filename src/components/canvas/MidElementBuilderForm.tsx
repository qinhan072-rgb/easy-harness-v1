import { type FormEvent, useState } from 'react';
import {
  midElementCatalog,
  midElementColumnOptions,
} from '../../data/canvasCatalog';
import type { MidElementDraftInput, MidElementType } from '../../types/prototype';

type MidElementBuilderFormProps = {
  onAdd: (input: MidElementDraftInput) => void;
};

export function MidElementBuilderForm({ onAdd }: MidElementBuilderFormProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<MidElementType>('splice');
  const [column, setColumn] = useState<1 | 2 | 3>(2);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onAdd({
      label,
      type,
      column,
    });

    setLabel('');
  }

  return (
    <form className="builder-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <label className="field">
          <span>Type</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as MidElementType)}
          >
            {Object.keys(midElementCatalog).map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {midElementCatalog[typeOption as MidElementType].label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Column</span>
          <select
            value={column}
            onChange={(event) => setColumn(Number(event.target.value) as 1 | 2 | 3)}
          >
            {midElementColumnOptions.map((columnOption) => (
              <option key={columnOption} value={columnOption}>
                Column {columnOption}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Label</span>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={`Example: ${midElementCatalog[type].label} A`}
        />
      </label>

      <p className="helper-copy">
        {midElementCatalog[type].detail} Leave the label blank only if you want this block to remain incomplete.
      </p>

      <button type="submit" className="button button-secondary">
        Add mid element
      </button>
    </form>
  );
}
