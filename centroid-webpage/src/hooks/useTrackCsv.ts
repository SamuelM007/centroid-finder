import { useEffect, useState } from 'react';
import { api } from '../api';
import { parseTrackCsv, type TrackRow } from '../lib/csv';

// Downloads and parses a finished job's CSV. Does nothing until `ready` is true
// (the job is done), so it isn't requested before the file exists.
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
