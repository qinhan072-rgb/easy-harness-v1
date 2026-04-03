import { Link, NavLink, Outlet } from 'react-router-dom';
import { useRequestSession } from '../context/RequestSessionContext';
import {
  getPublicRequestStage,
  publicPreviewStatuses,
  publicRequestSourceLabels,
  publicRequestStageMeta,
  requestSourceLabels,
  requestStatusMeta,
} from '../data/requestMeta';

export function AppLayout() {
  const { activeRequest, isLoadingActiveRequest } = useRequestSession();
  const currentRequestTitle = isLoadingActiveRequest
    ? 'Loading request...'
    : activeRequest
      ? activeRequest.projectName
      : 'No open request';
  const primaryNavItems = [
    { label: 'Home', path: '/' },
    { label: 'AI Agent', path: '/ai-agent' },
    { label: 'Configurator', path: '/configurator' },
    {
      label: 'Track Request',
      path: activeRequest ? `/processing/${activeRequest.id}` : '/processing',
    },
  ];
  const reviewNavItem = activeRequest
    ? publicPreviewStatuses.has(activeRequest.status)
      ? { label: 'Harness Preview', path: `/preview/${activeRequest.id}` }
      : null
    : null;
  const visibleNavItems = reviewNavItem
    ? [...primaryNavItems, reviewNavItem]
    : primaryNavItems;
  const currentPublicStage = activeRequest
    ? publicRequestStageMeta[getPublicRequestStage(activeRequest.status)].label
    : null;
  const currentRequestDetail = activeRequest
    ? `${requestSourceLabels[activeRequest.source]} · ${requestStatusMeta[activeRequest.status].label}`
    : 'Submit from AI, canvas, or upload.';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__inner">
          <Link to="/" className="brand-block brand-block--inline">
            <span className="eyebrow">Custom Harness Intake</span>
            <strong>Easy Harness</strong>
          </Link>
          <nav className="top-nav" aria-label="Primary">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive ? 'nav-link nav-link--top is-active' : 'nav-link nav-link--top'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="topbar__status">
            <span className="topbar__status-label">Open request</span>
            <strong>{currentRequestTitle}</strong>
            <p>
              {activeRequest
                ? `${publicRequestSourceLabels[activeRequest.source]} - ${currentPublicStage}`
                : 'AI Agent or Configurator'}
            </p>
          </div>
        </div>
      </header>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}
