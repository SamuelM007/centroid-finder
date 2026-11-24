import { useEffect, useState } from 'react';
import { api, type JobStatusResponse } from '../api';

/** How often a job's status is checked, in milliseconds. */
export const STATUS_POLL_MS = 2000;

/**
 * Follows a job's status: checks `GET /api/process/{jobId}/status` right away, then every
 * 2 seconds until the job is done or failed. If the server can't be reached, it keeps
 * retrying every 4 seconds. Switching to a different `jobId` starts over.
 *
 * @param jobId the job to follow, or `null` when there's no job yet (does nothing)
 * @returns
 * - `status`: the latest status response, or `null` before the first check
 * - `connectionLost`: true while the server can't be reached
 */
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
