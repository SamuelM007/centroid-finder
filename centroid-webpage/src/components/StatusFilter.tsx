import type { JobStatus } from '../api';

export type StatusFilterValue = 'all' | JobStatus;

const OPTIONS: Array<[StatusFilterValue, string]> = [
  ['all', 'All'],
  ['processing', 'Processing'],
  ['done', 'Done'],
  ['error', 'Error'],
];

interface Props {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}

// A row of toggle buttons for filtering jobs by status
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
