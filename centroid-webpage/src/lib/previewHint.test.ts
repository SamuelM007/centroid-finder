import { describe, expect, it } from 'vitest';
import { getPreviewHint, LOOSE_PERCENT, NOISY_GROUPS, type PreviewStats } from './previewHint';

const stats = (matchingPercent: number, groups: number): PreviewStats => ({
  matchingPercent,
  groups,
  largest: groups ? { x: 10, y: 20 } : { x: -1, y: -1 },
});

describe('getPreviewHint', () => {
  it('says the frame is loading before there are stats', () => {
    expect(getPreviewHint(null).kind).toBe('neutral');
  });

  it('warns when nothing matches', () => {
    const hint = getPreviewHint(stats(0, 0));
    expect(hint.kind).toBe('warn');
    expect(hint.text).toMatch(/Nothing matches/);
  });

  it('says the threshold is too loose when much of the frame matches', () => {
    expect(getPreviewHint(stats(LOOSE_PERCENT + 1, 1)).kind).toBe('bad');
  });

  it('warns about noise when there are many groups', () => {
    const hint = getPreviewHint(stats(2, NOISY_GROUPS + 1));
    expect(hint.kind).toBe('warn');
    expect(hint.text).toMatch(/Noisy/);
  });

  it('says it looks good otherwise', () => {
    expect(getPreviewHint(stats(2.4, 24)).kind).toBe('good');
  });
});
