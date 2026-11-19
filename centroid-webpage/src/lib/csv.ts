// The processor writes one "seconds,x,y" row per frame, with -1,-1 when nothing matched.

export interface TrackRow {
  seconds: number;
  x: number;
  y: number;
}

export const isMatch = (r: TrackRow) => !(r.x === -1 && r.y === -1);

export function parseTrackCsv(text: string): TrackRow[] {
  const rows: TrackRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.trim().split(',');
    if (parts.length < 3) continue;
    const [seconds, x, y] = parts.map(Number);
    // skips a header line or anything else that isn't numeric
    if ([seconds, x, y].some((n) => Number.isNaN(n))) continue;
    rows.push({ seconds, x, y });
  }
  return rows;
}

// Index of the last row at or before time t (rows are in time order), or -1
export function rowIndexAt(rows: TrackRow[], t: number): number {
  let lo = 0;
  let hi = rows.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].seconds <= t) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

// Splits rows into runs of matched rows, so lines aren't drawn across "no match" gaps
export function matchedSegments(rows: TrackRow[]): TrackRow[][] {
  const segments: TrackRow[][] = [];
  let current: TrackRow[] = [];
  for (const r of rows) {
    if (isMatch(r)) {
      current.push(r);
    } else if (current.length > 0) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

// Time ranges [start, end] where no match was found
export function gapRanges(rows: TrackRow[]): Array<[number, number]> {
  const gaps: Array<[number, number]> = [];
  let start: number | null = null;
  for (const row of rows) {
    if (!isMatch(row)) {
      if (start === null) start = row.seconds;
    } else if (start !== null) {
      gaps.push([start, row.seconds]);
      start = null;
    }
  }
  if (start !== null) gaps.push([start, rows[rows.length - 1].seconds]);
  return gaps;
}
