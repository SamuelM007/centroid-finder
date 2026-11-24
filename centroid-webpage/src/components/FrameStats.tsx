import type { PreviewStats } from '../lib/previewHint';

/**
 * The "This frame" list on the preview page: matching pixels, number of groups, and the
 * largest group's centroid.
 * @param stats the preview's results, or `null` before the first frame is analyzed (shows dashes)
 */
const FrameStats = ({ stats }: { stats: PreviewStats | null }) => (
  <dl className="stats-list">
    <div>
      <dt>Matching pixels</dt>
      <dd className="mono">{stats ? `${stats.matchingPercent.toFixed(1)}%` : '–'}</dd>
    </div>
    <div>
      <dt>Groups found</dt>
      <dd className="mono">{stats ? stats.groups : '–'}</dd>
    </div>
    <div>
      <dt>Largest centroid</dt>
      <dd className="mono">{stats ? `(${stats.largest.x}, ${stats.largest.y})` : '–'}</dd>
    </div>
  </dl>
);

export default FrameStats;
