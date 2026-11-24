import { useEffect, useState } from 'react';
import { api } from '../api';
import { parseTrackCsv, type TrackRow } from '../lib/csv';

/**
 * Downloads and parses a finished job's CSV.
 *
 * @param jobId the job whose CSV to load
 * @param ready pass true once the job is done; until then nothing is requested,
 *   because the file doesn't exist yet
 * @returns
 * - `rows`: the parsed rows, or `null` until loaded
 * - `failed`: true if the CSV couldn't be downloaded
 */
export function useTrackCsv(jobId: string, ready: boolean) {
  const [rows, setRows] = useState<TrackRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    api
      .getResultCsv(jobId)
      .then((text) => {
        if (!cancelled) setRows(parseTrackCsv(text));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, ready]);

  return { rows, failed };
}
