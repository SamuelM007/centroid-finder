import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusPill from '../components/StatusPill';
import StatusFilter, { type StatusFilterValue } from '../components/StatusFilter';
import ColorChip from '../components/ColorChip';
import { withData, type WithDataProps } from '../hoc/withData';
import { api, type Job } from '../api';
import { formatStarted } from '../lib/format';

/** One row of the Jobs table, with a link to the job's results page. */
const JobRow = ({ job }: { job: Job }) => (
  <tr>
    <td className="mono">{job.id.slice(0, 8)}</td>
    <td className="strong">{job.fileName}</td>
    <td>
      <ColorChip hex={job.targetColor} />
    </td>
    <td className="mono">{job.threshold}</td>
    <td>
      <StatusPill status={job.status} />
    </td>
    <td className="muted">{formatStarted(job.createdAt)}</td>
    <td className="table__action">
      <Link to={`/jobs/${encodeURIComponent(job.id)}`} aria-label={`View job ${job.id.slice(0, 8)}`}>
        View
      </Link>
    </td>
  </tr>
);

/**
 * The status filter and the table of jobs. `data` (every job, newest first) comes from
 * the withData HOC. Shows a message instead when there are no jobs yet.
 */
function JobsTable({ data: jobs }: WithDataProps<Job[]>) {
  const [filter, setFilter] = useState<StatusFilterValue>('all');

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
      <StatusFilter value={filter} onChange={setFilter} />
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
            {shown.map((job) => (
              <JobRow key={job.id} job={job} />
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

/**
 * {@link JobsTable} wrapped by the withData HOC. Reloads every 3 seconds while any job is
 * still processing, so statuses update without refreshing the page.
 */
const JobsTableWithData = withData<Job[]>(JobsTable, () => api.getJobs(), {
  loadingMessage: 'Loading jobs…',
  pollWhile: (jobs) => jobs.some((j) => j.status === 'processing'),
});

/** The job history page at `/jobs`: every processing run saved in the backend's database. */
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
