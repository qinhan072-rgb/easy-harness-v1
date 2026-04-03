import { Link } from 'react-router-dom';
import { useRequestSession } from '../context/RequestSessionContext';
import {
  formatRequestTimestamp,
  requestSourceLabels,
  requestStatusMeta,
} from '../data/requestMeta';

export function HomePage() {
  const { activeRequest, isLoadingActiveRequest } = useRequestSession();
  const currentRequestTitle = activeRequest
    ? activeRequest.projectName
    : 'No open request';
  const currentRequestDetail = activeRequest
    ? `${requestSourceLabels[activeRequest.source]} · Qty ${activeRequest.quantity} · ${activeRequest.leadTimePreference}`
    : 'Start from AI Agent, Configurator Canvas, or Upload References.';
  const currentStatus = activeRequest
    ? requestStatusMeta[activeRequest.status].label
    : isLoadingActiveRequest
      ? 'Loading request'
      : 'No open request';
  const currentTimestamp = activeRequest
    ? `Created ${formatRequestTimestamp(activeRequest.createdAt)}`
    : 'No request record is open on this device.';
  const processingPath = activeRequest
    ? `/processing/${activeRequest.id}`
    : '/processing';
  const orderPath = activeRequest
    ? `/order-confirmation/${activeRequest.id}`
    : '/order-confirmation';

  return (
    <div className="page-stack home-page">
      <section className="home-hero home-hero--focused">
        <div className="home-hero__content">
          <span className="eyebrow">Custom Harness Intake</span>
          <h2>Custom wire harness intake for quotation and draft preparation.</h2>
          <p>
            Submit a harness request through AI Agent, Configurator Canvas, or
            reference files. Easy Harness organizes intake records, structured
            details, and draft preparation for quotation.
          </p>
          <div className="home-entry-rail">
            <Link to="/ai-agent" className="home-entry-link home-entry-link--primary">
              <span className="home-entry-link__label">Start with AI Agent</span>
              <span className="home-entry-link__copy">
                Describe the harness requirement, connection points, quantity,
                and lead time in plain language.
              </span>
            </Link>
            <Link to="/configurator" className="home-entry-link">
              <span className="home-entry-link__label">Use Configurator Canvas</span>
              <span className="home-entry-link__copy">
                Prepare one structured left-to-right connection path within the
                current canvas boundary.
              </span>
            </Link>
            <Link to="/upload" className="home-entry-link">
              <span className="home-entry-link__label">Upload References</span>
              <span className="home-entry-link__copy">
                Submit drawings, photos, BOMs, pinouts, sketches, and mixed
                reference files with the intake record.
              </span>
            </Link>
          </div>
        </div>

        <div className="home-hero__visual" aria-hidden="true">
          <div className="home-visual">
            <div className="home-visual__surface">
              <svg viewBox="0 0 720 430" className="home-visual__diagram">
                <defs>
                  <linearGradient id="homeHarnessStroke" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#4f83ff" />
                    <stop offset="100%" stopColor="#155eef" />
                  </linearGradient>
                  <filter id="homeHarnessShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#155eef" floodOpacity="0.12" />
                  </filter>
                  <filter id="homeNodeShadow" x="-20%" y="-20%" width="140%" height="160%">
                    <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#101828" floodOpacity="0.12" />
                  </filter>
                </defs>

                <rect className="home-visual__glow home-visual__glow--left" x="76" y="88" width="180" height="188" rx="90" />
                <rect className="home-visual__glow home-visual__glow--right" x="478" y="104" width="164" height="164" rx="82" />

                <g className="home-visual__routes-shadow">
                  <path d="M236 174 C314 174, 314 130, 360 130 S454 170, 514 170" />
                  <path d="M236 204 C328 204, 332 252, 392 252 S456 216, 514 216" />
                  <path d="M236 230 C318 230, 332 198, 380 198 S452 252, 514 252" />
                </g>
                <g className="home-visual__routes">
                  <path d="M236 174 C314 174, 314 130, 360 130 S454 170, 514 170" />
                  <path d="M236 204 C328 204, 332 252, 392 252 S456 216, 514 216" />
                  <path d="M236 230 C318 230, 332 198, 380 198 S452 252, 514 252" />
                </g>

                <g filter="url(#homeNodeShadow)">
                  <rect className="home-visual__node home-visual__node--connector" x="88" y="132" width="148" height="112" rx="26" />
                  <text className="home-visual__label home-visual__label--eyebrow" x="114" y="162">SOURCE</text>
                  <text className="home-visual__label home-visual__label--title" x="114" y="194">Deutsch DT</text>
                  <text className="home-visual__label home-visual__label--note" x="114" y="220">Sealed 4-pin</text>

                  <rect className="home-visual__node home-visual__node--mid" x="318" y="104" width="112" height="60" rx="22" />
                  <text className="home-visual__label home-visual__label--eyebrow" x="342" y="128">MID</text>
                  <text className="home-visual__label home-visual__label--title" x="342" y="150">Splice</text>

                  <rect className="home-visual__node home-visual__node--mid" x="362" y="224" width="118" height="58" rx="22" />
                  <text className="home-visual__label home-visual__label--eyebrow" x="388" y="247">MID</text>
                  <text className="home-visual__label home-visual__label--title" x="388" y="269">Fuse</text>

                  <rect className="home-visual__node home-visual__node--connector" x="514" y="142" width="142" height="116" rx="26" />
                  <text className="home-visual__label home-visual__label--eyebrow" x="544" y="172">DESTINATION</text>
                  <text className="home-visual__label home-visual__label--title" x="544" y="204">M12 Circular</text>
                  <text className="home-visual__label home-visual__label--note" x="544" y="230">Sensor side</text>
                </g>

                <g className="home-visual__anchors">
                  <circle cx="236" cy="174" r="6" />
                  <circle cx="236" cy="204" r="6" />
                  <circle cx="236" cy="230" r="6" />

                  <circle cx="318" cy="128" r="5" />
                  <circle cx="318" cy="146" r="5" />
                  <circle cx="430" cy="137" r="5" />

                  <circle cx="362" cy="252" r="5" />
                  <circle cx="480" cy="252" r="5" />

                  <circle cx="514" cy="170" r="6" />
                  <circle cx="514" cy="216" r="6" />
                  <circle cx="514" cy="252" r="6" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="home-support-band">
        <div className="home-support-band__item">
          <span className="eyebrow">Request flow</span>
          <strong>Each intake path leads to the same request record.</strong>
          <p>Requests move from intake to draft preparation, customer review, and quotation.</p>
        </div>
        <div className="home-support-band__item">
          <span className="eyebrow">Open request</span>
          <strong>{currentRequestTitle}</strong>
          <p>
            {activeRequest
              ? `${requestSourceLabels[activeRequest.source]} - Qty ${activeRequest.quantity} - ${activeRequest.leadTimePreference}`
              : 'No request record is selected.'}
          </p>
          <p>{currentTimestamp}</p>
          <span className="home-support-band__status">{currentStatus}</span>
        </div>
        <div className="home-support-band__actions">
          <Link to={processingPath} className="button button-secondary">
            View Request Status
          </Link>
          <Link to={orderPath} className="button button-ghost">
            View Order Draft
          </Link>
        </div>
      </section>
    </div>
  );
}
