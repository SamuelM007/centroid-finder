import { summarizeTrack, type TrackRow } from '../lib/csv';
import { formatDuration } from '../lib/format';

interface Props {
  /** The job's CSV rows. */
  rows: TrackRow[];
  /** URL of the CSV file. */
  downloadUrl: string;
  /** File name the browser saves the CSV as. */
  downloadName: string;
}

/**
 * The Summary card on the results page: frames, % tracked, frames with no match,
 * duration (see `summarizeTrack`), and the Download CSV button.
 */
const ResultSummary = ({ rows, downloadUrl, downloadName }: Props) => {
  const summary = summarizeTrack(rows);
  const stats: Array<[string, string]> = [
    ['Frames', String(summary.frames)],
    ['Tracked', `${summary.trackedPercent}%`],
    ['No match', String(summary.noMatch)],
    ['Duration', formatDuration(summary.duration)],
  ];

  return (
    <aside className="two-col__side card stack">
      <h2>Summary</h2>
      <dl className="stat-grid">
        {stats.map(([label, value]) => (
          <div key={label} className="stat">
            <dt className="muted small">{label}</dt>
            <dd className="stat__value">{value}</dd>
          </div>
        ))}
      </dl>
      <a href={downloadUrl} download={downloadName} className="btn btn--primary btn--lg push-bottom">
        Download CSV
      </a>
    </aside>
  );
};

export default ResultSummary;
