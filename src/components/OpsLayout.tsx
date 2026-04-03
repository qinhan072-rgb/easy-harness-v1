import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useOpsAccess } from '../context/OpsAccessContext';

export function OpsLayout({ children }: { children: ReactNode }) {
  const { clearOpsAccess } = useOpsAccess();

  return (
    <div className="app-shell">
      <header className="opsbar">
        <div className="opsbar__inner">
          <Link to="/ops/requests" className="brand-block brand-block--inline">
            <span className="eyebrow">Internal</span>
            <strong>Easy Harness Ops</strong>
          </Link>
          <div className="opsbar__copy">
            <strong>Request handling</strong>
            <p>Review intake records, prepare drafts, and export handoff workbooks.</p>
          </div>
          <div className="opsbar__actions">
            <Link to="/" className="button button-ghost">
              Public Site
            </Link>
            <button type="button" className="button button-secondary" onClick={clearOpsAccess}>
              Lock Ops
            </button>
          </div>
        </div>
      </header>
      <main className="content-area">{children}</main>
    </div>
  );
}
