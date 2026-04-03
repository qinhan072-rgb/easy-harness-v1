import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { UnifiedRequest } from '../types/request';
import { getRequestById } from '../utils/requestApi';

const STORAGE_KEY = 'easy-harness.active-request-id';
const HIDDEN_PUBLIC_REQUEST_MARKERS = [
  'copy cleanup test',
  'proxy verification',
  'sample valid canvas request',
];

type RequestSessionContextValue = {
  activeRequestId: string | null;
  activeRequest: UnifiedRequest | null;
  isLoadingActiveRequest: boolean;
  setActiveRequestId: (requestId: string | null) => void;
  refreshActiveRequest: () => Promise<void>;
};

const RequestSessionContext = createContext<RequestSessionContextValue | null>(null);

function shouldHideFromPublicShell(request: UnifiedRequest) {
  const haystack = `${request.projectName} ${request.requestSummary}`.toLowerCase();
  return HIDDEN_PUBLIC_REQUEST_MARKERS.some((marker) => haystack.includes(marker));
}

export function RequestSessionProvider({ children }: { children: ReactNode }) {
  const [activeRequestId, setActiveRequestIdState] = useState<string | null>(() =>
    window.localStorage.getItem(STORAGE_KEY),
  );
  const [activeRequest, setActiveRequest] = useState<UnifiedRequest | null>(null);
  const [isLoadingActiveRequest, setIsLoadingActiveRequest] = useState(false);

  const setActiveRequestId = useCallback((requestId: string | null) => {
    setActiveRequestIdState(requestId);

    if (requestId) {
      window.localStorage.setItem(STORAGE_KEY, requestId);
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    setActiveRequest(null);
  }, []);

  const refreshActiveRequest = useCallback(async () => {
    if (!activeRequestId) {
      setActiveRequest(null);
      return;
    }

    setIsLoadingActiveRequest(true);

    try {
      const request = await getRequestById(activeRequestId);

      if (shouldHideFromPublicShell(request)) {
        window.localStorage.removeItem(STORAGE_KEY);
        setActiveRequestIdState(null);
        setActiveRequest(null);
        return;
      }

      setActiveRequest(request);
    } catch {
      setActiveRequest(null);
    } finally {
      setIsLoadingActiveRequest(false);
    }
  }, [activeRequestId]);

  useEffect(() => {
    void refreshActiveRequest();
  }, [refreshActiveRequest]);

  const value = useMemo(
    () => ({
      activeRequestId,
      activeRequest,
      isLoadingActiveRequest,
      setActiveRequestId,
      refreshActiveRequest,
    }),
    [
      activeRequest,
      activeRequestId,
      isLoadingActiveRequest,
      refreshActiveRequest,
      setActiveRequestId,
    ],
  );

  return (
    <RequestSessionContext.Provider value={value}>
      {children}
    </RequestSessionContext.Provider>
  );
}

export function useRequestSession() {
  const context = useContext(RequestSessionContext);

  if (!context) {
    throw new Error('useRequestSession must be used within RequestSessionProvider.');
  }

  return context;
}
