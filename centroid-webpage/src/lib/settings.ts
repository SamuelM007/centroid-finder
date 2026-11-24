import { HEX_RE, MAX_THRESHOLD, normalizeHex } from './color';

/** Default target color: tracks the salamander in the sample video well. */
export const DEFAULT_COLOR = '#660005';

/** Default threshold: tracks the salamander in the sample video well. */
export const DEFAULT_THRESHOLD = 67;

/** The two settings a processing job needs. */
export interface TrackingSettings {
  /** Target color as `"#RRGGBB"`. */
  color: string;
  /** Maximum color distance, 1–441. */
  threshold: number;
}

/**
 * Reads the preview page's starting settings from the URL, e.g. `?color=FFA200&threshold=164`.
 * This is how "Run again with new settings" passes a past job's settings to the preview page.
 *
 * @param color the `color` query value, or `null` if it's missing
 * @param threshold the `threshold` query value, or `null` if it's missing
 * @returns the settings; any missing or invalid value is replaced by its default
 */
export function settingsFromUrl(color: string | null, threshold: string | null): TrackingSettings {
  const t = Number(threshold);
  return {
    color: color && HEX_RE.test(color) ? normalizeHex(color) : DEFAULT_COLOR,
    threshold: Number.isInteger(t) && t > 0 && t <= MAX_THRESHOLD ? t : DEFAULT_THRESHOLD,
  };
}

/**
 * Builds the link to the preview page with these settings filled in.
 * @param targetColor with or without `#`
 * @example previewUrl('ensantina.mp4', '660005', 67) // "/preview/ensantina.mp4?color=660005&threshold=67"
 */
export function previewUrl(fileName: string, targetColor: string, threshold: number): string {
  return `/preview/${encodeURIComponent(fileName)}?color=${targetColor.replace('#', '')}&threshold=${threshold}`;
}
