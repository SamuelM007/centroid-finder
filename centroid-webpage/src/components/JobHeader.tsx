import { Link } from 'react-router-dom';
import type { Job } from '../api';
import { formatStarted } from '../lib/format';
import ColorChip from './ColorChip';

interface Props {
  job: Job;
  /** Link to the preview page with this job's settings filled in. */
  runAgainUrl: string;
}

/** Top of the results page: breadcrumb, video name, the job's settings, and the "Run again" link. */
const JobHeader = ({ job, runAgainUrl }: Props) => (
  <div className="page-head">
    <div className="page-head__text">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/jobs">Jobs</Link>
        <span aria-hidden="true">/</span>
        <span className="mono">{job.id.slice(0, 8)}</span>
      </nav>
      <h1>{job.fileName}</h1>
      <div className="meta-row">
        <span className="meta-item">
          Target <ColorChip hex={job.targetColor} bold />
        </span>
        <span className="meta-item">
          Threshold <span className="mono strong">{job.threshold}</span>
        </span>
        <span className="meta-item">Started {formatStarted(job.createdAt)}</span>
      </div>
    </div>
    <Link to={runAgainUrl} className="btn btn--secondary">
      Run again with new settings
    </Link>
  </div>
);

export default JobHeader;
