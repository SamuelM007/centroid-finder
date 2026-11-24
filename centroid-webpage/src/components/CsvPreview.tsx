import { isMatch, type TrackRow } from '../lib/csv';

/** How many rows of the CSV to show. */
const PREVIEW_ROWS = 8;

/**
 * The first few rows of a job's CSV as a table, with a note on rows where nothing matched.
 * @param rows every row of the CSV; only the first 8 are shown
 */
const CsvPreview = ({ rows }: { rows: TrackRow[] }) => (
  <section className="card stack">
    <div className="card__head">
      <h2>CSV preview</h2>
      <span className="muted small">
        Showing {Math.min(PREVIEW_ROWS, rows.length)} of {rows.length} rows
      </span>
    </div>
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">seconds</th>
            <th scope="col">x</th>
            <th scope="col">y</th>
            <th scope="col">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, PREVIEW_ROWS).map((r) => (
            <tr key={r.seconds}>
              <td className="mono">{r.seconds}</td>
              <td className="mono">{r.x}</td>
              <td className="mono">{r.y}</td>
              <td className="muted">{isMatch(r) ? '' : 'No match in this frame'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default CsvPreview;
