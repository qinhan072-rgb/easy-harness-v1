import { useCallback, useEffect, useState } from 'react';
import { useRequestSession } from '../context/RequestSessionContext';
import type { UnifiedRequest } from '../types/request';
import { getRequestById } from '../utils/requestApi';

export function useRequestRecord(explicitRequestId?: string | null) {
  const { activeRequestId, setActiveRequestId } = useRequestSession();
  const resolvedRequestId = explicitRequestId ?? activeRequestId;
  const [request, setRequest] = useState<UnifiedRequest | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(resolvedRequestId));
  const [error, setError] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    if (!resolvedRequestId) {
      setRequest(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const nextRequest = await getRequestById(resolvedRequestId);
      setRequest(nextRequest);
      setActiveRequestId(nextRequest.id);
      setError(null);
    } catch (loadError) {
      setRequest(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this request.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [resolvedRequestId, setActiveRequestId]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  return {
    requestId: resolvedRequestId,
    request,
    isLoading,
    error,
    reload: loadRequest,
  };
}
