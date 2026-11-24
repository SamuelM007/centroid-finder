import { HEX_RE, MAX_THRESHOLD, normalizeHex } from './color';

// Settings that track the salamander in the sample video well
export const DEFAULT_COLOR = '#660005';
export const DEFAULT_THRESHOLD = 67;

export interface TrackingSettings {
  color: string; // "#RRGGBB"
  threshold: number;
}

// Reads the starting settings from the URL (?color=FFA200&threshold=164), which is how
// "Run again with new settings" passes a past job's settings to the preview page.
// Missing or invalid values fall back to the defaults.
export function settingsFromUrl(color: string | null, threshold: string | null): TrackingSettings {
  const t = Number(threshold);
  return {
    color: color && HEX_RE.test(color) ? normalizeHex(color) : DEFAULT_COLOR,
    threshold: Number.isInteger(t) && t > 0 && t <= MAX_THRESHOLD ? t : DEFAULT_THRESHOLD,
  };
}

// The preview page link for running a video again with these settings
export function previewUrl(fileName: string, targetColor: string, threshold: number): string {
  return `/preview/${encodeURIComponent(fileName)}?color=${targetColor.replace('#', '')}&threshold=${threshold}`;
}
