import { useEffect, useState } from 'react';
import { api, type Job } from '../api';

/** How often a processing job is reloaded, in milliseconds. */
export const JOB_POLL_MS = 2000;

/**
 * Loads one job (`GET /api/jobs/{jobId}`) and reloads it every 2 seconds while it's still
 * processing. If the server can't be reached, it keeps retrying every 4 seconds.
 * Stops when the component unmounts or `jobId` changes.
 *
 * @returns
 * - `job`: the job, or `null` until it has loaded
 * - `notFound`: true if the server says there's no such job
 * - `connectionLost`: true while the server can't be reached
 */
export function useJob(jobId: string) {
  const [job, setJob] = useState<Job | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const j = await api.getJob(jobId);
        if (cancelled) return;
        setConnectionLost(false);
        if (!j) {
          setNotFound(true);
          return;
        }
        setJob(j);
        if (j.status === 'processing') timer = setTimeout(load, JOB_POLL_MS);
      } catch {
        if (cancelled) return;
        setConnectionLost(true);
        timer = setTimeout(load, JOB_POLL_MS * 2);
      }
    };
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId]);

  return { job, notFound, connectionLost };
}
