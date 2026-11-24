import type { JobStatus } from '../api';

/** A job status to show, or `'all'` to show every job. */
export type StatusFilterValue = 'all' | JobStatus;

/** Each filter's value and button label, in display order. */
const OPTIONS: Array<[StatusFilterValue, string]> = [
  ['all', 'All'],
  ['processing', 'Processing'],
  ['done', 'Done'],
  ['error', 'Error'],
];

interface Props {
  /** The selected filter. */
  value: StatusFilterValue;
  /** Called when a different filter is clicked. */
  onChange: (value: StatusFilterValue) => void;
}

/** A row of toggle buttons (All, Processing, Done, Error) for filtering the Jobs table. */
const StatusFilter = ({ value, onChange }: Props) => (
  <div role="group" aria-label="Filter by status" className="chips">
    {OPTIONS.map(([option, label]) => (
      <button
        key={option}
        type="button"
        className={`chip${value === option ? ' chip--selected' : ''}`}
        aria-pressed={value === option}
        onClick={() => onChange(option)}
      >
        {label}
      </button>
    ))}
  </div>
);

export default StatusFilter;
