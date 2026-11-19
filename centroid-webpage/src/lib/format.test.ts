import { describe, expect, it } from 'vitest';
import { formatDuration, formatStarted, parseServerDate } from './format';

describe('parseServerDate', () => {
  it('reads SQLite timestamps as UTC', () => {
    expect(parseServerDate('2026-11-19 07:24:42').toISOString()).toBe('2026-11-19T07:24:42.000Z');
  });
});

describe('formatStarted', () => {
  const now = new Date('2026-11-19T12:00:00');
  const local = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ');

  it('says Today and Yesterday for recent jobs', () => {
    expect(formatStarted(local(new Date('2026-11-19T09:05:00')), now)).toMatch(/^Today, /);
    expect(formatStarted(local(new Date('2026-11-18T09:05:00')), now)).toMatch(/^Yesterday, /);
  });

  it('shows the date for older jobs', () => {
    expect(formatStarted(local(new Date('2026-11-01T09:05:00')), now)).toMatch(/^Nov 1, /);
  });

  it('returns unparseable input unchanged', () => {
    expect(formatStarted('not a date', now)).toBe('not a date');
  });
});

describe('formatDuration', () => {
  it('formats seconds as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(75.9)).toBe('1:15');
    expect(formatDuration(478.5)).toBe('7:58');
  });

  it('shows a dash for invalid values', () => {
    expect(formatDuration(NaN)).toBe('–');
    expect(formatDuration(-1)).toBe('–');
  });
});
