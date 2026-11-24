import type { MouseEvent } from 'react';
import { gapRanges, matchedSegments, type TrackRow } from '../lib/csv';
import { formatDuration } from '../lib/format';

interface Props {
  /** The job's CSV rows. */
  rows: TrackRow[];
  /** Length of the x axis, in seconds. */
  duration: number;
  /** Top of the y axis, in video pixels. */
  maxValue: number;
  /** Current video time in seconds, drawn as a vertical line. */
  time: number;
  /** Called with a time in seconds when the chart is clicked. */
  onSeek: (seconds: number) => void;
}

/** Size of the SVG's drawing area. The SVG stretches to fit, so these are just units. */
const W = 1000;
const H = 220;

/**
 * Line chart of the centroid's x and y position over time, drawn as an SVG.
 * Frames with no match are left as gaps and shaded gray. Clicking anywhere on the chart
 * calls `onSeek` with that point's time, so the video can jump there.
 */
const PositionChart = ({ rows, duration, maxValue, time, onSeek }: Props) => {
  const sx = (s: number) => (duration > 0 ? (s / duration) * W : 0);
  const sy = (v: number) => H - (maxValue > 0 ? (v / maxValue) * H : 0);
  const segments = matchedSegments(rows);
  const gaps = gapRanges(rows);
  const points = (seg: TrackRow[], key: 'x' | 'y') => seg.map((r) => `${sx(r.seconds)},${sy(r[key])}`).join(' ');

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(fraction * duration);
  };

  const ticks = [0, duration / 3, (2 * duration) / 3, duration];

  return (
    <div className="chart">
      <div className="chart__y-axis" aria-hidden="true">
        <span>{Math.round(maxValue)}</span>
        <span>{Math.round(maxValue / 2)}</span>
        <span>0</span>
      </div>
      <div className="chart__plot">
        <button type="button" className="chart__hit" onClick={handleClick} aria-label="Jump the video to a point in time">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Centroid x and y position over time">
            <line x1="0" y1="1" x2={W} y2="1" className="chart__grid" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1={H / 2} x2={W} y2={H / 2} className="chart__grid" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1={H - 1} x2={W} y2={H - 1} className="chart__baseline" vectorEffect="non-scaling-stroke" />
            {gaps.map(([a, b]) => (
              <rect key={a} x={sx(a)} y="0" width={Math.max(2, sx(b) - sx(a))} height={H} className="chart__gap" />
            ))}
            {segments.map((seg) => (
              <polyline key={`x${seg[0].seconds}`} points={points(seg, 'x')} className="chart__x" vectorEffect="non-scaling-stroke" />
            ))}
            {segments.map((seg) => (
              <polyline key={`y${seg[0].seconds}`} points={points(seg, 'y')} className="chart__y" vectorEffect="non-scaling-stroke" />
            ))}
            <line x1={sx(time)} y1="0" x2={sx(time)} y2={H} className="chart__now" vectorEffect="non-scaling-stroke" />
          </svg>
        </button>
        <div className="chart__x-axis" aria-hidden="true">
          {ticks.map((t, i) => (
            <span key={i}>{formatDuration(t)}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PositionChart;
