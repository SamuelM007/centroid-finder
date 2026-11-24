/**
 * Reads a timestamp from the server as a Date. SQLite stores times in UTC without a
 * time zone, so the `Z` is added to stop the browser reading it as local time.
 * @example parseServerDate('2026-11-18 22:42:00') // 22:42 UTC
 */
export function parseServerDate(s: string): Date {
  return new Date(s.replace(' ', 'T') + 'Z');
}

/**
 * Formats a job's start time for display, in the viewer's local time.
 *
 * @param s a server timestamp, e.g. `"2026-11-18 22:42:00"`
 * @param now the current time (a parameter so tests can fix it)
 * @returns `"Today, 5:42 PM"`, `"Yesterday, 4:02 PM"` or `"Nov 16, 11:20 AM"`;
 *   the input unchanged if it can't be parsed
 */
export function formatStarted(s: string, now = new Date()): string {
  const d = parseServerDate(s);
  if (Number.isNaN(d.getTime())) return s;
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

/**
 * Formats seconds as minutes and seconds.
 * @returns `"m:ss"`, e.g. `75` → `"1:15"`; a dash for negative or invalid values
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '–';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
