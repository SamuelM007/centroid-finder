export const MAX_THRESHOLD = 441; // distance from black to white: sqrt(3 * 255^2), rounded down

export const HEX_RE = /^#?[0-9A-Fa-f]{6}$/;

// "ffa200" or "#ffa200" -> "#FFA200"
export const normalizeHex = (s: string) => '#' + s.replace('#', '').toUpperCase();
