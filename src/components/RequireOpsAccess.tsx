import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useOpsAccess } from '../context/OpsAccessContext';

export function RequireOpsAccess({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isOpsUnlocked } = useOpsAccess();

  if (!isOpsUnlocked) {
    return <Navigate to="/ops" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
