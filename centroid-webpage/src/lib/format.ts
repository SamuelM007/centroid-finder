// "2026-11-18 22:42:00" (UTC, as SQLite stores it) -> Date
export function parseServerDate(s: string): Date {
  return new Date(s.replace(' ', 'T') + 'Z');
}

// "Today, 5:42 PM", "Yesterday, 4:02 PM" or "Nov 16, 11:20 AM"
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

// 75 -> "1:15"
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '–';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
