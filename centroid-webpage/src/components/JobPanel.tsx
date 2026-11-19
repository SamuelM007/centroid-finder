import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useJobStatus } from '../hooks/useJobStatus';

interface Props {
  fileName: string;
  color: string; // "#RRGGBB"
  threshold: number;
}

// The "Process Video with These Settings" button, plus the status of the job it started
const JobPanel = ({ fileName, color, threshold }: Props) => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { status, connectionLost } = useJobStatus(jobId);

  const hex = color.slice(1); // the backend wants RRGGBB without '#'
  const processing = jobId !== null && (status === null || status.status === 'processing');

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      setJobId(await api.startProcessing(fileName, hex, threshold));
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Could not start processing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack stack--sm">
      <span className="muted small">Request</span>
      <code className="code-block">
        POST /api/process/{fileName}?targetColor={hex}&amp;threshold={threshold}
      </code>
      <button type="button" className="btn btn--primary btn--lg" onClick={submit} disabled={submitting || processing}>
        {submitting ? 'Starting…' : 'Process Video with These Settings'}
      </button>

      {submitError && (
        <p className="hint hint--bad" role="alert">
          {submitError}
        </p>
      )}

      {jobId && (
        <div className="job-status" aria-live="polite">
          {connectionLost && <p className="hint hint--warn">Lost connection to the server. Retrying…</p>}

          {processing && (
            <>
              <div className="row-between">
                <span className="strong">Processing…</span>
                <span className="mono muted small">job {jobId.slice(0, 8)}</span>
              </div>
              <div className="progress" role="progressbar" aria-label="Processing video">
                <div className="progress__bar" />
              </div>
              <p className="muted small">Checking every 2 seconds. Long videos can take several minutes.</p>
            </>
          )}

          {status?.status === 'done' && (
            <>
              <p className="hint hint--good">Done! The centroid was tracked in every frame.</p>
              <div className="button-row">
                <a href={status.result ?? api.resultUrl(jobId)} download className="btn btn--secondary">
                  Download CSV
                </a>
                <Link to={`/jobs/${encodeURIComponent(jobId)}`} className="btn btn--secondary">
                  View results
                </Link>
              </div>
            </>
          )}

          {status?.status === 'error' && (
            <p className="hint hint--bad" role="alert">
              Processing failed: {status.error ?? 'the processor exited with an error'}. Check the settings and try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default JobPanel;
