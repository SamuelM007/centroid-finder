import type { JobStatus } from '../api';

export type PillKind = JobStatus | 'none';

const LABELS: Record<PillKind, string> = {
  done: 'Done',
  processing: 'Processing',
  error: 'Error',
  none: 'Not processed',
};

const StatusPill = ({ status, label }: { status: PillKind; label?: string }) => (
  <span className={`pill pill--${status}`}>
    <span className="pill__dot" />
    {label ?? LABELS[status]}
  </span>
);

export default StatusPill;
