import { describe, expect, it } from 'vitest';
import { DEFAULT_COLOR, DEFAULT_THRESHOLD, previewUrl, settingsFromUrl } from './settings';

describe('settingsFromUrl', () => {
  it('reads a valid color and threshold', () => {
    expect(settingsFromUrl('ffa200', '164')).toEqual({ color: '#FFA200', threshold: 164 });
  });

  it('uses the defaults when the values are missing', () => {
    expect(settingsFromUrl(null, null)).toEqual({ color: DEFAULT_COLOR, threshold: DEFAULT_THRESHOLD });
  });

  it('uses the defaults for invalid values', () => {
    expect(settingsFromUrl('red', '12.5')).toEqual({ color: DEFAULT_COLOR, threshold: DEFAULT_THRESHOLD });
    expect(settingsFromUrl('#12345', '0')).toEqual({ color: DEFAULT_COLOR, threshold: DEFAULT_THRESHOLD });
    expect(settingsFromUrl('123456', '999').threshold).toBe(DEFAULT_THRESHOLD);
  });
});

describe('previewUrl', () => {
  it('builds the preview link with the settings in the query string', () => {
    expect(previewUrl('ensantina.mp4', '660005', 67)).toBe('/preview/ensantina.mp4?color=660005&threshold=67');
  });

  it('strips a # from the color and encodes the file name', () => {
    expect(previewUrl('my video.mp4', '#FFA200', 10)).toBe('/preview/my%20video.mp4?color=FFA200&threshold=10');
  });
});
