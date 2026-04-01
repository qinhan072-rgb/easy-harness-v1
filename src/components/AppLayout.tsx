import { NavLink, Outlet } from 'react-router-dom';
import { orderStatusCopy } from '../data/mockOrderDrafts';
import { navItems } from '../data/mockData';
import { usePrototype } from '../context/PrototypeContext';

export function AppLayout() {
  const { state } = usePrototype();
  const currentDraftLabel = state.orderDraft
    ? orderStatusCopy[state.orderDraft.status].label
    : 'Not started';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="eyebrow">Product Prototype</span>
          <h1>Easy Harness V1</h1>
          <p>
            Front-end only workflow prototype for harness request intake,
            configuration, and order confirmation.
          </p>
        </div>

        <nav className="side-nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'nav-link is-active' : 'nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-summary">
            <span className="eyebrow">Current flow</span>
            <strong>
              {state.orderDraft ? state.orderDraft.sourceTitle : 'No active draft'}
            </strong>
            <p>{currentDraftLabel}</p>
          </div>
          <div className="status-pill status-pill--success">Mock data only</div>
          <p>No backend calls are wired in this version.</p>
        </div>
      </aside>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}
