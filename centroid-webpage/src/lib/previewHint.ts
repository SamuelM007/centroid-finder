import type { Coordinate } from './centroid';

/** What the preview found in the first frame with the current settings. */
export interface PreviewStats {
  /** Share of the frame's pixels that matched, from 0 to 100. */
  matchingPercent: number;
  /** Number of connected groups of matching pixels. */
  groups: number;
  /** Centroid of the biggest group, or `(-1, -1)` when nothing matched. */
  largest: Coordinate;
}

/** How a hint is colored: gray, green, orange or red. */
export type HintKind = 'neutral' | 'good' | 'warn' | 'bad';

/** Advice shown under the preview stats. */
export interface Hint {
  text: string;
  kind: HintKind;
}

/** Above this share of matching pixels, the background is probably matching too. */
export const LOOSE_PERCENT = 20;

/** Above this many groups, the match is probably picking up noise. */
export const NOISY_GROUPS = 25;

/**
 * Turns the preview stats into advice about the current settings. Checks run in order,
 * and the first problem found wins: nothing matches, then too loose, then too noisy.
 *
 * @param stats the preview's stats, or `null` while the first frame is still loading
 */
export function getPreviewHint(stats: PreviewStats | null): Hint {
  if (!stats) {
    return { text: 'Loading the first frame…', kind: 'neutral' };
  }
  if (stats.groups === 0) {
    return { text: 'Nothing matches. Raise the threshold or click the object in the first frame to pick its color.', kind: 'warn' };
  }
  if (stats.matchingPercent > LOOSE_PERCENT) {
    return { text: 'Loose: a lot of the frame matches. Try lowering the threshold.', kind: 'bad' };
  }
  if (stats.groups > NOISY_GROUPS) {
    return { text: 'Noisy: many small groups match. Only the largest is tracked, so try a lower threshold.', kind: 'warn' };
  }
  return { text: 'Looks good. The orange dot marks the centroid that will be tracked.', kind: 'good' };
}
