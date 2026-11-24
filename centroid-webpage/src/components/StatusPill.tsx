import type { JobStatus } from '../api';

/** A job status, or `'none'` for a video that has never been processed. Sets the pill's color. */
export type PillKind = JobStatus | 'none';

/** Default text for each kind of pill. */
const LABELS: Record<PillKind, string> = {
  done: 'Done',
  processing: 'Processing',
  error: 'Error',
  none: 'Not processed',
};

/**
 * A small colored label with a dot, showing a job's status.
 * @param status sets the color, and the text unless `label` is given
 * @param label optional text to show instead of the default for `status`
 */
const StatusPill = ({ status, label }: { status: PillKind; label?: string }) => (
  <span className={`pill pill--${status}`}>
    <span className="pill__dot" />
    {label ?? LABELS[status]}
  </span>
);

export default StatusPill;
