import { Link } from 'react-router-dom';
import { HarnessPreviewGraphic } from '../components/preview/HarnessPreviewGraphic';
import { useRequestSession } from '../context/RequestSessionContext';
import {
  formatRequestTimestamp,
  getPublicRequestStage,
  publicPreviewStatuses,
  publicRequestSourceLabels,
  publicRequestStageMeta,
} from '../data/requestMeta';
import { buildSampleHarnessPreviewModel } from '../utils/harnessPreviewModel';

export function HomeLandingPage() {
  const { activeRequest, isLoadingActiveRequest } = useRequestSession();
  const samplePreview = buildSampleHarnessPreviewModel();
  const processingPath = activeRequest
    ? `/processing/${activeRequest.id}`
    : '/processing';
  const previewPath =
    activeRequest && publicPreviewStatuses.has(activeRequest.status)
      ? `/generated/${activeRequest.id}`
      : null;

  return (
    <div className="page-stack home-page">
      <section className="home-hero home-hero--focused">
        <div className="home-hero__content">
          <span className="eyebrow">Custom harness intake</span>
          <h2>Generated harness preview for quotation-ready custom harness requests.</h2>
          <p>
            Start in AI Agent for natural-language intake with reference files, or use
            Configurator for one structured harness path. Easy Harness organizes the
            request and generates a visible harness preview before order placement.
          </p>
          <div className="home-entry-rail">
            <Link to="/ai-agent" className="home-entry-link home-entry-link--primary">
              <span className="home-entry-link__label">Start with AI Agent</span>
              <span className="home-entry-link__copy">
                Describe the harness, attach photos or pinouts, and generate the
                preview from one intake workspace.
              </span>
            </Link>
            <Link to="/configurator" className="home-entry-link">
              <span className="home-entry-link__label">Use Configurator</span>
              <span className="home-entry-link__copy">
                Prepare one structured harness path and generate the preview when
                the layout is complete.
              </span>
            </Link>
            <Link to={processingPath} className="home-entry-link home-entry-link--quiet">
              <span className="home-entry-link__label">Track Request</span>
              <span className="home-entry-link__copy">
                Return later to check the current stage of an open request.
              </span>
            </Link>
          </div>
        </div>

        <div className="home-hero__visual" aria-hidden="true">
          <div className="home-preview-hero">
            <HarnessPreviewGraphic model={samplePreview} />
          </div>
        </div>
      </section>

      <section className="home-support-band">
        <div className="home-support-band__item">
          <span className="eyebrow">Generated result</span>
          <strong>Customer preview and production preview from the same request.</strong>
          <p>
            The public side shows the generated harness. The internal side receives
            structured production tables and open engineering items.
          </p>
        </div>
        <div className="home-support-band__item">
          <span className="eyebrow">Open request</span>
          <strong>
            {activeRequest ? activeRequest.projectName : 'No request open'}
          </strong>
          <p>
            {activeRequest
              ? `${publicRequestSourceLabels[activeRequest.source]} - Qty ${activeRequest.quantity}`
              : isLoadingActiveRequest
                ? 'Loading request record'
                : 'Start from AI Agent or Configurator.'}
          </p>
          <p>
            {activeRequest
              ? `Updated ${formatRequestTimestamp(activeRequest.updatedAt)}`
              : 'A current request appears here on this device.'}
          </p>
          <span className="home-support-band__status">
            {activeRequest
              ? publicRequestStageMeta[getPublicRequestStage(activeRequest.status)].label
              : 'No active request'}
          </span>
        </div>
        <div className="home-support-band__actions">
          <Link to={processingPath} className="button button-secondary">
            Track Request
          </Link>
          {previewPath ? (
            <Link to={previewPath} className="button button-ghost">
              Open Harness Preview
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
