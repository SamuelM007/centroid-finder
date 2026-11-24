import { describe, expect, it } from 'vitest';
import { averageColorAt, clickToPixel, type Pixels } from './pixels';

// A width x height image filled by a function of (x, y) -> [r, g, b]
function image(width: number, height: number, color: (x: number, y: number) => [number, number, number]): Pixels {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = color(x, y);
      data.set([r, g, b, 255], (y * width + x) * 4);
    }
  }
  return { width, height, data };
}

describe('averageColorAt', () => {
  it('returns the color of a solid area', () => {
    const img = image(10, 10, () => [255, 162, 0]);
    expect(averageColorAt(img, 5, 5)).toBe('#FFA200');
  });

  it('averages the 5x5 square around the point', () => {
    // left half black, right half white; the square around x=5 has 2 black and 3 white columns
    const img = image(10, 10, (x) => (x < 5 ? [0, 0, 0] : [255, 255, 255]));
    expect(averageColorAt(img, 5, 5)).toBe('#999999'); // 3/5 of 255 = 153 = 0x99
  });

  it('only uses pixels inside the image at the edges', () => {
    const img = image(3, 3, (x, y) => (x === 0 && y === 0 ? [30, 30, 30] : [0, 0, 0]));
    // around (0,0) only the 3x3 top-left pixels exist: one is 30, eight are 0
    expect(averageColorAt(img, 0, 0)).toBe('#030303');
  });

  it('returns null when the point is far outside the image', () => {
    expect(averageColorAt(image(2, 2, () => [0, 0, 0]), 50, 50)).toBeNull();
  });
});

describe('clickToPixel', () => {
  it('scales a click on a shrunken image to full-size pixel coordinates', () => {
    const rect = { left: 100, top: 50, width: 408, height: 360 }; // shown at half of 816 x 720
    expect(clickToPixel(100, 50, rect, 816, 720)).toEqual({ x: 0, y: 0 });
    expect(clickToPixel(304, 230, rect, 816, 720)).toEqual({ x: 408, y: 360 });
  });
});
