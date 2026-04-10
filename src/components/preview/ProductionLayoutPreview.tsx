import type { HarnessPreviewModel } from '../../utils/harnessPreviewModel';

type ProductionLayoutPreviewProps = {
  model: HarnessPreviewModel;
  requestId?: string;
};

function endpointPosition(role: 'source' | 'load' | 'branch') {
  switch (role) {
    case 'source':
      return { x: 134, y: 232 };
    case 'branch':
      return { x: 644, y: 108 };
    default:
      return { x: 850, y: 232 };
  }
}

export function ProductionLayoutPreview({
  model,
  requestId,
}: ProductionLayoutPreviewProps) {
  const source = endpointPosition('source');
  const load = endpointPosition('load');
  const branch = endpointPosition('branch');
  const mainWire = model.wires[0];
  const branchWire = model.wires[1];
  const branchEnabled = model.hasBranch && Boolean(branchWire);

  return (
    <div className="production-layout-preview">
      <svg
        viewBox="0 0 980 420"
        className="production-layout-preview__svg"
        role="img"
        aria-label={`${model.title} production layout preview`}
      >
        <rect
          x="22"
          y="24"
          width="936"
          height="372"
          rx="28"
          className="production-layout-preview__board"
        />
        <path
          d={`M ${source.x} ${source.y} H 420 Q 468 232 514 232 H ${load.x}`}
          className="production-layout-preview__path"
        />
        {branchEnabled ? (
          <path
            d={`M 514 232 V 154 Q 514 126 544 126 H ${branch.x}`}
            className="production-layout-preview__path production-layout-preview__path--branch"
          />
        ) : null}

        <line
          x1="134"
          y1="70"
          x2="850"
          y2="70"
          className="production-layout-preview__dimension"
        />
        <text
          x="492"
          y="60"
          textAnchor="middle"
          className="production-layout-preview__dimension-text"
        >
          {mainWire?.lengthLabel || 'Length to confirm'}
        </text>

        {branchEnabled ? (
          <>
            <line
              x1="708"
              y1="126"
              x2="708"
              y2="232"
              className="production-layout-preview__dimension"
            />
            <text
              x="724"
              y="178"
              className="production-layout-preview__dimension-text"
            >
              {branchWire?.lengthLabel || 'Branch length'}
            </text>
          </>
        ) : null}

        {model.endpoints.map((endpoint) => {
          const position = endpointPosition(endpoint.role);

          return (
            <g key={endpoint.id} className="production-layout-preview__endpoint">
              <rect
                x={position.x - 42}
                y={position.y - 18}
                width="84"
                height="36"
                rx="14"
                className="production-layout-preview__endpoint-body"
              />
              <text
                x={position.x}
                y={position.y + 6}
                textAnchor="middle"
                className="production-layout-preview__endpoint-text"
              >
                {endpoint.family}
              </text>
              <text
                x={position.x}
                y={position.y + 46}
                textAnchor="middle"
                className="production-layout-preview__annotation"
              >
                {endpoint.label}
              </text>
            </g>
          );
        })}

        {model.elements.map((element, index) => {
          const x = branchEnabled ? (index === 0 ? 514 : 384 + index * 110) : 420 + index * 120;
          const y = branchEnabled && index === 0 ? 232 : 232;

          return (
            <g key={element.id} className="production-layout-preview__element">
              <circle cx={x} cy={y} r="16" className="production-layout-preview__element-node" />
              <text
                x={x}
                y={y - 26}
                textAnchor="middle"
                className="production-layout-preview__annotation"
              >
                {element.label}
              </text>
            </g>
          );
        })}

        <g className="production-layout-preview__reference">
          <rect x="720" y="292" width="192" height="74" rx="18" />
          <text x="744" y="320" className="production-layout-preview__reference-title">
            Production reference
          </text>
          <text x="744" y="342" className="production-layout-preview__reference-copy">
            {requestId || model.title}
          </text>
          <text x="744" y="360" className="production-layout-preview__reference-copy">
            {model.mainWireSpec}
          </text>
        </g>
      </svg>
    </div>
  );
}
