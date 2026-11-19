import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusPill from '../components/StatusPill';
import { withData, type WithDataProps } from '../hoc/withData';
import { api, type Job, type JobStatus } from '../api';
import { formatStarted } from '../lib/format';

type Filter = 'all' | JobStatus;
const FILTERS: Array<[Filter, string]> = [
  ['all', 'All'],
  ['processing', 'Processing'],
  ['done', 'Done'],
  ['error', 'Error'],
];

function JobsTable({ data: jobs }: WithDataProps<Job[]>) {
  const [filter, setFilter] = useState<Filter>('all');

  if (jobs.length === 0) {
    return (
      <div className="notice">
        No jobs yet. <Link to="/videos">Pick a video</Link> to start one.
      </div>
    );
  }

  const shown = jobs.filter((j) => filter === 'all' || j.status === filter);

  return (
    <>
      <div role="group" aria-label="Filter by status" className="chips">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`chip${filter === value ? ' chip--selected' : ''}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card card--flush table-wrap">
        <table className="table table--jobs">
          <thead>
            <tr>
              <th scope="col">Job</th>
              <th scope="col">Video</th>
              <th scope="col">Target</th>
              <th scope="col">Threshold</th>
              <th scope="col">Status</th>
              <th scope="col">Started</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((j) => (
              <tr key={j.id}>
                <td className="mono">{j.id.slice(0, 8)}</td>
                <td className="strong">{j.fileName}</td>
                <td>
                  <span className="meta-item">
                    <span className="color-chip" style={{ background: `#${j.targetColor}` }} aria-hidden="true" />
                    <span className="mono">{j.targetColor.toUpperCase()}</span>
                  </span>
                </td>
                <td className="mono">{j.threshold}</td>
                <td>
                  <StatusPill status={j.status} />
                </td>
                <td className="muted">{formatStarted(j.createdAt)}</td>
                <td className="table__action">
                  <Link to={`/jobs/${encodeURIComponent(j.id)}`} aria-label={`View job ${j.id.slice(0, 8)}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  No jobs with this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// refresh every 3 seconds while any job is still processing
const JobsTableWithData = withData<Job[]>(JobsTable, () => api.getJobs(), {
  loadingMessage: 'Loading jobs…',
  pollWhile: (jobs) => jobs.some((j) => j.status === 'processing'),
});

const Jobs = () => (
  <main className="page">
    <div className="page-head">
      <div className="page-head__text">
        <h1>Jobs</h1>
        <p className="muted">Every processing run, saved in the backend's database.</p>
      </div>
    </div>
    <JobsTableWithData />
  </main>
);

export default Jobs;
