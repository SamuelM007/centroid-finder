import { useEffect, useState } from 'react';
import { api, type JobStatusResponse } from '../api';

export const STATUS_POLL_MS = 2000;

// Checks GET /api/process/{jobId}/status right away and then every 2 seconds until the
// job is done or failed. Pass null when there's no job to follow yet.
export function useJobStatus(jobId: string | null) {
  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);

  // a new job starts with no status (state adjusted during render, as React recommends)
  const [trackedId, setTrackedId] = useState(jobId);
  if (trackedId !== jobId) {
    setTrackedId(jobId);
    setStatus(null);
    setConnectionLost(false);
  }

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      try {
        const s = await api.getJobStatus(jobId);
        if (cancelled) return;
        setStatus(s);
        setConnectionLost(false);
        if (s.status === 'processing') timer = setTimeout(check, STATUS_POLL_MS);
      } catch {
        if (cancelled) return;
        setConnectionLost(true);
        timer = setTimeout(check, STATUS_POLL_MS * 2);
      }
    };
    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId]);

  return { status, connectionLost };
}
