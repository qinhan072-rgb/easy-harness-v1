import type { WireConnection } from '../../types/prototype';

type WireConnectionCardProps = {
  wire: WireConnection;
  fromLabel: string;
  toLabel: string;
};

export function WireConnectionCard({
  wire,
  fromLabel,
  toLabel,
}: WireConnectionCardProps) {
  return (
    <article className="wire-card">
      <div className="wire-card__top">
        <strong>
          {fromLabel}:{wire.fromPin}
        </strong>
        <span className="wire-arrow" aria-hidden="true">
          →
        </span>
        <strong>
          {toLabel}:{wire.toPin}
        </strong>
      </div>
      <span className="wire-card__meta">
        {wire.length} mm | {wire.wireType} | {wire.wireGauge} | {wire.wireColor}
      </span>
      <p>
        {wire.length} mm • {wire.wireType} • {wire.wireGauge} • {wire.wireColor}
      </p>
    </article>
  );
}
