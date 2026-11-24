import PositionChart from './PositionChart';
import type { TrackRow } from '../lib/csv';

interface Props {
  rows: TrackRow[];
  duration: number;
  maxValue: number;
  time: number;
  onSeek: (seconds: number) => void;
}

/**
 * The "Position over time" card on the results page: a legend, the {@link PositionChart},
 * and a line explaining how to use it. Takes the same props as `PositionChart`.
 */
const PositionChartCard = (props: Props) => (
  <section className="card stack">
    <div className="card__head">
      <h2>Position over time</h2>
      <div className="legend">
        <span className="legend__item">
          <span className="legend__line legend__line--x" />x
        </span>
        <span className="legend__item">
          <span className="legend__line legend__line--y" />y
        </span>
        <span className="legend__item">
          <span className="legend__gap" />
          No match (−1, −1)
        </span>
      </div>
    </div>
    <PositionChart {...props} />
    <p className="muted small">Click the chart to jump the video to that moment. The dark line marks the current time.</p>
  </section>
);

export default PositionChartCard;
