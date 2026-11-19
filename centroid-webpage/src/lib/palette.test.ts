import { describe, expect, it } from 'vitest';
import { dominantColors } from './palette';

function pixels(...colors: Array<[number, number, number, number]>): Uint8ClampedArray {
  const out: number[] = [];
  for (const [r, g, b, count] of colors) for (let i = 0; i < count; i++) out.push(r, g, b, 255);
  return Uint8ClampedArray.from(out);
}

describe('dominantColors', () => {
  it('ranks colors by how often they appear', () => {
    const data = pixels([255, 0, 0, 50], [0, 0, 255, 30], [0, 255, 0, 10]);
    expect(dominantColors(data, 3)).toEqual(['#FF0000', '#0000FF', '#00FF00']);
  });

  it('skips colors too close to one already picked', () => {
    const data = pixels([200, 30, 40, 50], [205, 32, 44, 40], [0, 0, 0, 10]);
    expect(dominantColors(data, 3)).toEqual(['#C81E28', '#000000']);
  });

  it('averages the pixels in a bucket', () => {
    const data = pixels([16, 16, 16, 1], [30, 30, 30, 1]);
    expect(dominantColors(data, 1)).toEqual(['#171717']);
  });
});
