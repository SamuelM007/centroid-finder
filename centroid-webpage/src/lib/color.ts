/**
 * Largest useful threshold: the distance from black to white, √(3 × 255²) ≈ 441.67,
 * rounded down. The server rejects anything above it.
 */
export const MAX_THRESHOLD = 441;

/** Matches a six-digit hex color, with or without a leading `#`. */
export const HEX_RE = /^#?[0-9A-Fa-f]{6}$/;

/**
 * Puts a hex color in the form the UI uses: upper case with a leading `#`.
 * @example normalizeHex('ffa200') // "#FFA200"
 */
export const normalizeHex = (s: string) => '#' + s.replace('#', '').toUpperCase();
