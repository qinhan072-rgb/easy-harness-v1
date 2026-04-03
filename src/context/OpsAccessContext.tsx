import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';
import { verifyOpsAccess } from '../utils/requestApi';

const STORAGE_KEY = 'easy-harness.ops-passcode';

type OpsAccessContextValue = {
  isOpsUnlocked: boolean;
  opsPasscode: string | null;
  unlockOps: (passcode: string) => Promise<void>;
  clearOpsAccess: () => void;
};

const OpsAccessContext = createContext<OpsAccessContextValue | null>(null);

export function OpsAccessProvider({ children }: { children: ReactNode }) {
  const [opsPasscode, setOpsPasscode] = useState<string | null>(() =>
    window.sessionStorage.getItem(STORAGE_KEY),
  );

  async function unlockOps(passcode: string) {
    const normalizedPasscode = passcode.trim();
    await verifyOpsAccess(normalizedPasscode);
    window.sessionStorage.setItem(STORAGE_KEY, normalizedPasscode);
    setOpsPasscode(normalizedPasscode);
  }

  function clearOpsAccess() {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setOpsPasscode(null);
  }

  const value = useMemo(
    () => ({
      isOpsUnlocked: Boolean(opsPasscode),
      opsPasscode,
      unlockOps,
      clearOpsAccess,
    }),
    [opsPasscode],
  );

  return (
    <OpsAccessContext.Provider value={value}>
      {children}
    </OpsAccessContext.Provider>
  );
}

export function useOpsAccess() {
  const context = useContext(OpsAccessContext);

  if (!context) {
    throw new Error('useOpsAccess must be used within OpsAccessProvider.');
  }

  return context;
}
