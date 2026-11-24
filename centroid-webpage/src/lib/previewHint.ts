import type { Coordinate } from './centroid';

// What the preview found in the first frame with the current settings
export interface PreviewStats {
  matchingPercent: number;
  groups: number;
  largest: Coordinate; // (-1, -1) when nothing matched
}

export type HintKind = 'neutral' | 'good' | 'warn' | 'bad';

export interface Hint {
  text: string;
  kind: HintKind;
}

// Above this share of matching pixels, the background is probably matching too
export const LOOSE_PERCENT = 20;
// Above this many groups, the match is probably picking up noise
export const NOISY_GROUPS = 25;

// Turns the preview stats into advice about the current settings
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
