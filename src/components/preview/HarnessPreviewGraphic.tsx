import type { HarnessPreviewModel } from '../../utils/harnessPreview';

type HarnessPreviewGraphicProps = {
  model: HarnessPreviewModel;
  className?: string;
};

function buildEndpointPosition(role: 'source' | 'load' | 'branch') {
  switch (role) {
    case 'source':
      return { x: 130, y: 350 };
    case 'branch':
      return { x: 700, y: 158 };
    default:
      return { x: 824, y: 350 };
  }
}

function buildElementPosition(index: number, hasBranch: boolean) {
  if (hasBranch) {
    return index === 0 ? { x: 474, y: 332 } : { x: 632, y: 350 };
  }

  return index === 0 ? { x: 396, y: 350 } : { x: 604, y: 350 };
}

function renderConnector(model: HarnessPreviewModel, endpoint: HarnessPreviewModel['endpoints'][number]) {
  const position = buildEndpointPosition(endpoint.role);
  const isSource = endpoint.role === 'source';
  const width = endpoint.role === 'branch' ? 146 : 164;
  const height = endpoint.role === 'branch' ? 90 : 102;
  const bodyX = position.x - width / 2;
  const bodyY = position.y - height / 2;
  const noseWidth = endpoint.role === 'branch' ? 20 : 24;
  const noseX = isSource ? bodyX + width - 10 : bodyX - 14;
  const pinXs = isSource
    ? [bodyX + width - 8, bodyX + width - 8, bodyX + width - 8]
    : [bodyX + 8, bodyX + 8, bodyX + 8];
  const pinYs = endpoint.role === 'branch' ? [position.y - 16, position.y, position.y + 16] : [position.y - 20, position.y, position.y + 20];

  return (
    <g key={endpoint.id} className={`harness-preview__connector harness-preview__connector--${endpoint.role}`}>
      <rect
        x={bodyX}
        y={bodyY}
        width={width}
        height={height}
        rx="28"
        className="harness-preview__connector-body"
      />
      <rect
        x={noseX}
        y={position.y - height / 2 + 12}
        width={noseWidth}
        height={height - 24}
        rx="12"
        className="harness-preview__connector-nose"
      />
      <rect
        x={bodyX + 18}
        y={bodyY + 16}
        width={width - 36}
        height={22}
        rx="11"
        className="harness-preview__connector-sheen"
      />
      {pinXs.map((pinX, index) => (
        <circle
          key={`${endpoint.id}-pin-${index}`}
          cx={pinX}
          cy={pinYs[index]}
          r="6"
          className="harness-preview__pin"
        />
      ))}
      <text x={bodyX + 20} y={bodyY + 58} className="harness-preview__connector-label">
        {endpoint.family}
      </text>
      <text x={bodyX + 20} y={bodyY + 78} className="harness-preview__connector-note">
        {endpoint.label}
      </text>
    </g>
  );
}

function renderElement(
  element: HarnessPreviewModel['elements'][number],
  index: number,
  hasBranch: boolean,
) {
  const position = buildElementPosition(index, hasBranch);
  const width = element.kind === 'splice' ? 104 : 128;
  const height = element.kind === 'fuse' ? 58 : 52;
  const x = position.x - width / 2;
  const y = position.y - height / 2;

  return (
    <g key={element.id} className={`harness-preview__element harness-preview__element--${element.kind}`}>
      <rect x={x} y={y} width={width} height={height} rx="24" className="harness-preview__element-body" />
      <text x={position.x} y={position.y - 3} className="harness-preview__element-label" textAnchor="middle">
        {element.label}
      </text>
      <text x={position.x} y={position.y + 14} className="harness-preview__element-note" textAnchor="middle">
        {element.detail}
      </text>
    </g>
  );
}

function renderDimension(
  label: string,
  value: string,
  x1: number,
  x2: number,
  y: number,
  estimated?: boolean,
) {
  const midX = (x1 + x2) / 2;

  return (
    <g className="harness-preview__dimension" key={`${label}-${value}-${x1}-${x2}-${y}`}>
      <line x1={x1} y1={y} x2={x2} y2={y} className="harness-preview__dimension-line" />
      <line x1={x1} y1={y - 12} x2={x1} y2={y + 12} className="harness-preview__dimension-line" />
      <line x1={x2} y1={y - 12} x2={x2} y2={y + 12} className="harness-preview__dimension-line" />
      <rect x={midX - 88} y={y - 26} width="176" height="36" rx="18" className="harness-preview__dimension-pill" />
      <text x={midX} y={y - 3} className="harness-preview__dimension-text" textAnchor="middle">
        {label}: {value}
      </text>
      {estimated ? (
        <text x={midX} y={y + 12} className="harness-preview__dimension-note" textAnchor="middle">
          Estimated
        </text>
      ) : null}
    </g>
  );
}

export function HarnessPreviewGraphic({
  model,
  className,
}: HarnessPreviewGraphicProps) {
  const source = buildEndpointPosition('source');
  const load = buildEndpointPosition('load');
  const branch = buildEndpointPosition('branch');
  const split = buildElementPosition(0, model.hasBranch);
  const sleeve = buildElementPosition(1, model.hasBranch);
  const mainWire = model.wires[0];
  const branchWire = model.wires[1];
  const mainPath = model.hasBranch
    ? `M ${source.x + 76} ${source.y} C 308 ${source.y}, 360 ${source.y}, ${split.x - 60} ${split.y}
       S 714 ${load.y}, ${load.x - 86} ${load.y}`
    : `M ${source.x + 76} ${source.y} C 308 ${source.y - 6}, 370 ${source.y - 8}, ${split.x - 70} ${split.y}
       S 706 ${load.y + 4}, ${load.x - 86} ${load.y}`;
  const branchPath = model.hasBranch
    ? `M ${split.x + 36} ${split.y - 4} C 548 304, 590 258, ${branch.x - 74} ${branch.y + 22}`
    : null;

  return (
    <div className={`harness-preview${className ? ` ${className}` : ''}`}>
      <svg
        viewBox="0 0 980 620"
        className="harness-preview__svg"
        role="img"
        aria-label={`${model.title} harness preview`}
      >
        <defs>
          <linearGradient id="previewBackground" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f3f6fb" />
          </linearGradient>
          <linearGradient id="previewSheath" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#3b4454" />
            <stop offset="52%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#525f74" />
          </linearGradient>
          <linearGradient id="previewSheen" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.78)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="previewConnector" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#344054" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <filter id="previewShadow" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="20" stdDeviation="16" floodColor="#111827" floodOpacity="0.14" />
          </filter>
          <filter id="previewSoftShadow" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#155eef" floodOpacity="0.12" />
          </filter>
        </defs>

        <rect x="20" y="24" width="940" height="572" rx="34" fill="url(#previewBackground)" />
        <rect x="34" y="38" width="912" height="544" rx="28" className="harness-preview__board" />
        <ellipse cx="490" cy="464" rx="352" ry="74" className="harness-preview__floor-shadow" />

        <g filter="url(#previewShadow)">
          <path d={mainPath} className="harness-preview__cable-shadow" />
          <path d={mainPath} className="harness-preview__cable" />
          <path d={mainPath} className="harness-preview__cable-sheen" />
          {branchPath ? (
            <>
              <path d={branchPath} className="harness-preview__cable-shadow harness-preview__cable-shadow--branch" />
              <path d={branchPath} className="harness-preview__cable harness-preview__cable--branch" />
              <path d={branchPath} className="harness-preview__cable-sheen harness-preview__cable-sheen--branch" />
            </>
          ) : null}
        </g>

        <g filter="url(#previewSoftShadow)">
          {model.elements.map((element, index) => renderElement(element, index, model.hasBranch))}
          {model.endpoints.map((endpoint) => renderConnector(model, endpoint))}
        </g>

        {renderDimension(
          mainWire?.label || 'Main run',
          mainWire?.lengthLabel || 'Length to confirm',
          226,
          730,
          134,
          mainWire?.estimated,
        )}

        {model.hasBranch && branchWire
          ? renderDimension(
              branchWire.label,
              branchWire.lengthLabel,
              548,
              728,
              210,
              branchWire.estimated,
            )
          : null}

        <g className="harness-preview__spec-callout">
          <rect x="398" y="404" width="196" height="46" rx="22" />
          <text x="496" y="425" textAnchor="middle" className="harness-preview__spec-label">
            Main wire spec
          </text>
          <text x="496" y="444" textAnchor="middle" className="harness-preview__spec-value">
            {model.mainWireSpec}
          </text>
        </g>

        <g className="harness-preview__tag-cluster">
          <rect x="64" y="72" width="172" height="36" rx="18" className="harness-preview__tag-pill" />
          <text x="150" y="95" textAnchor="middle" className="harness-preview__tag-text">
            {model.previewBadge}
          </text>
          {model.isEstimated ? (
            <>
              <rect x="248" y="72" width="146" height="36" rx="18" className="harness-preview__tag-pill harness-preview__tag-pill--accent" />
              <text x="321" y="95" textAnchor="middle" className="harness-preview__tag-text harness-preview__tag-text--accent">
                Estimated details
              </text>
            </>
          ) : null}
        </g>
      </svg>
    </div>
  );
}
