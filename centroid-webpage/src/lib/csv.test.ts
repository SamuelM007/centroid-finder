import { describe, expect, it } from 'vitest';
import { gapRanges, isMatch, matchedSegments, parseTrackCsv, rowIndexAt, summarizeTrack } from './csv';

const rows = parseTrackCsv('0.0,1,10\n0.5,2,11\n1.0,-1,-1\n1.5,-1,-1\n2.0,5,5\n');

describe('parseTrackCsv', () => {
  it('parses seconds,x,y rows', () => {
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({ seconds: 0, x: 1, y: 10 });
    expect(rows[2]).toEqual({ seconds: 1, x: -1, y: -1 });
  });

  it('skips a header, blank lines and Windows line endings', () => {
    expect(parseTrackCsv('seconds,x,y\r\n0.1,3,4\r\n\r\n')).toEqual([{ seconds: 0.1, x: 3, y: 4 }]);
  });
});

describe('summarizeTrack', () => {
  it('counts frames, matches and duration', () => {
    expect(summarizeTrack(rows)).toEqual({ frames: 5, matched: 3, noMatch: 2, trackedPercent: 60, duration: 2 });
  });

  it('handles an empty CSV', () => {
    expect(summarizeTrack([])).toEqual({ frames: 0, matched: 0, noMatch: 0, trackedPercent: 0, duration: 0 });
  });
});

describe('isMatch', () => {
  it('treats -1,-1 as no match', () => {
    expect(isMatch({ seconds: 0, x: -1, y: -1 })).toBe(false);
    expect(isMatch({ seconds: 0, x: 0, y: 0 })).toBe(true);
  });
});

describe('rowIndexAt', () => {
  it('finds the last row at or before a time', () => {
    expect(rowIndexAt(rows, 0)).toBe(0);
    expect(rowIndexAt(rows, 0.7)).toBe(1);
    expect(rowIndexAt(rows, 99)).toBe(4);
  });

  it('returns -1 before the first row', () => {
    expect(rowIndexAt(rows, -1)).toBe(-1);
  });
});

describe('matchedSegments and gapRanges', () => {
  it('splits the track at no-match rows', () => {
    const segments = matchedSegments(rows);
    expect(segments.map((s) => s.length)).toEqual([2, 1]);
  });

  it('reports the time ranges with no match', () => {
    expect(gapRanges(rows)).toEqual([[1, 2]]);
  });

  it('closes a gap that runs to the end', () => {
    expect(gapRanges(parseTrackCsv('0,1,1\n1,-1,-1\n2,-1,-1'))).toEqual([[1, 2]]);
  });
});
