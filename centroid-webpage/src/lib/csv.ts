/**
 * @file Reading and summarizing the processor's output CSV.
 * The processor writes one `seconds,x,y` row per frame, with `-1,-1` when nothing matched.
 */

/** One frame of the tracking result. */
export interface TrackRow {
  /** Time of the frame in the video, in seconds. */
  seconds: number;
  /** Centroid x in video pixels, or -1 when nothing matched. */
  x: number;
  /** Centroid y in video pixels, or -1 when nothing matched. */
  y: number;
}

/** True if the object was found in this frame (the row isn't `-1,-1`). */
export const isMatch = (r: TrackRow) => !(r.x === -1 && r.y === -1);

/**
 * Parses the processor's CSV text into rows. Skips blank lines, a header line, and
 * anything else that isn't three numbers. Handles Windows (`\r\n`) line endings.
 */
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

/**
 * Finds the row for a moment in the video, using binary search.
 *
 * @param rows rows in time order
 * @param t time in seconds
 * @returns index of the last row at or before `t`, or -1 if `t` is before the first row
 */
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

/**
 * Splits the rows into runs of consecutive matched frames. Used to draw the tracked path
 * as separate lines, so no line is drawn across a stretch where the object wasn't found.
 */
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

/** The numbers shown in the results page's Summary card. */
export interface TrackSummary {
  /** Total number of frames (rows). */
  frames: number;
  /** Frames where the object was found. */
  matched: number;
  /** Frames where it wasn't (`-1,-1`). */
  noMatch: number;
  /** Share of frames where it was found, as a whole number from 0 to 100. */
  trackedPercent: number;
  /** Time of the last row, in seconds. */
  duration: number;
}

/** Counts frames, matches and duration for the Summary card. All zeros for an empty CSV. */
export function summarizeTrack(rows: TrackRow[]): TrackSummary {
  const matched = rows.filter(isMatch).length;
  return {
    frames: rows.length,
    matched,
    noMatch: rows.length - matched,
    trackedPercent: rows.length ? Math.round((matched / rows.length) * 100) : 0,
    duration: rows.length ? rows[rows.length - 1].seconds : 0,
  };
}

/**
 * Finds the stretches of time where the object wasn't found. Shown as gray bands on the
 * position chart.
 *
 * @returns `[start, end]` pairs in seconds. A gap that runs to the end of the video ends at the last row.
 */
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
