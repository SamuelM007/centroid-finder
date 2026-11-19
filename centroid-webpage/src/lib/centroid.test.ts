import { describe, expect, it } from 'vitest';
import {
  analyzeFrame,
  binarize,
  euclideanDistance,
  findConnectedGroups,
  findLargestCentroid,
  hexToInt,
  rgbToHex,
  type BinaryImage,
  type Group,
} from './centroid';

// These mirror the JUnit tests for the Java classes (EuclideanColorDistanceTest,
// DistanceImageBinarizerTest, DfsBinaryGroupFinderTest, CentroidTrackerTest) so we know
// the JavaScript port gives the same answers.

// Build a BinaryImage from rows of 0/1, like the int[][] in the Java tests
function img(rows: number[][]): BinaryImage {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  return { width, height, pixels: Uint8Array.from(rows.flat()) };
}

const g = (size: number, x: number, y: number): Group => ({ size, centroid: { x, y } });

// Build RGBA pixel data (like canvas ImageData.data) from rows of 0xRRGGBB colors
function rgba(rows: number[][]): Uint8ClampedArray {
  const out: number[] = [];
  for (const row of rows) for (const c of row) out.push((c >> 16) & 255, (c >> 8) & 255, c & 255, 255);
  return Uint8ClampedArray.from(out);
}

describe('euclideanDistance (EuclideanColorDistance)', () => {
  it('is 0 for the same color', () => {
    expect(euclideanDistance(0x123456, 0x123456)).toBeCloseTo(0, 3);
  });

  it('is 255 for one full channel', () => {
    expect(euclideanDistance(0xff0000, 0x000000)).toBeCloseTo(255, 3);
    expect(euclideanDistance(0x00ff00, 0x000000)).toBeCloseTo(255, 3);
    expect(euclideanDistance(0x0000ff, 0x000000)).toBeCloseTo(255, 3);
  });

  it('combines channels with the Pythagorean formula', () => {
    expect(euclideanDistance(0xff0000, 0x00ff00)).toBeCloseTo(Math.sqrt(2 * 255 * 255), 3);
    expect(euclideanDistance(0x000000, 0xffffff)).toBeCloseTo(441.673, 3);
  });

  it('is symmetric', () => {
    expect(euclideanDistance(0x102030, 0x405060)).toBe(euclideanDistance(0x405060, 0x102030));
  });
});

describe('binarize (DistanceImageBinarizer)', () => {
  it('marks pixels white only when threshold > distance (strictly)', () => {
    // distance from 0x000000 to 0x0a0000 is exactly 10
    const data = rgba([[0x000000, 0x0a0000, 0x0b0000]]);
    expect(Array.from(binarize(data, 3, 1, 0x000000, 10).pixels)).toEqual([1, 0, 0]);
    expect(Array.from(binarize(data, 3, 1, 0x000000, 11).pixels)).toEqual([1, 1, 0]);
  });

  it('matches nothing with threshold 0', () => {
    const data = rgba([[0x123456, 0x123456]]);
    expect(Array.from(binarize(data, 2, 1, 0x123456, 0).pixels)).toEqual([0, 0]);
  });

  it('ignores the alpha channel', () => {
    const data = Uint8ClampedArray.from([255, 0, 0, 0]); // red, fully transparent
    expect(Array.from(binarize(data, 1, 1, 0xff0000, 1).pixels)).toEqual([1]);
  });

  it('keeps width and height', () => {
    const b = binarize(rgba([[0, 0, 0], [0, 0, 0]]), 3, 2, 0, 1);
    expect([b.width, b.height]).toEqual([3, 2]);
  });
});

describe('findConnectedGroups (DfsBinaryGroupFinder)', () => {
  describe('input validation', () => {
    it('rejects an empty image', () => {
      expect(() => findConnectedGroups(img([]))).toThrow();
      expect(() => findConnectedGroups(img([[]]))).toThrow();
    });

    it('rejects values other than 0 and 1', () => {
      expect(() => findConnectedGroups(img([[1, 0], [2, 1]]))).toThrow();
    });

    it('rejects pixel data that does not match the size', () => {
      expect(() => findConnectedGroups({ width: 3, height: 2, pixels: new Uint8Array(5) })).toThrow();
    });
  });

  describe('basic behavior', () => {
    it('returns no groups for an all-zero image', () => {
      expect(findConnectedGroups(img([[0, 0], [0, 0]]))).toEqual([]);
    });

    it('finds a single pixel', () => {
      expect(findConnectedGroups(img([[1]]))).toEqual([g(1, 0, 0)]);
    });

    it('treats a full image as one group', () => {
      // x sum = 2, 2/4 = 0 ; y sum = 2, 2/4 = 0 (integer division)
      expect(findConnectedGroups(img([[1, 1], [1, 1]]))).toEqual([g(4, 0, 0)]);
    });
  });

  describe('connectivity', () => {
    it('does not connect diagonal pixels', () => {
      // equal size, so larger x comes first
      expect(findConnectedGroups(img([[1, 0], [0, 1]]))).toEqual([g(1, 1, 1), g(1, 0, 0)]);
    });

    it('connects around turns', () => {
      // (0,0) (1,0) (1,1) (1,2) (2,2): x sum 5, y sum 5, 5 pixels -> (1, 1)
      expect(findConnectedGroups(img([[1, 1, 0], [0, 1, 0], [0, 1, 1]]))).toEqual([g(5, 1, 1)]);
    });

    it('treats a snake shape as one group', () => {
      // x sum = 8, y sum = 7, 7 pixels -> (1, 1)
      expect(findConnectedGroups(img([[1, 1, 1], [0, 0, 1], [1, 1, 1]]))).toEqual([g(7, 1, 1)]);
    });

    it('handles a big group without overflowing the stack', () => {
      const big = Array.from({ length: 300 }, () => Array(300).fill(1));
      expect(findConnectedGroups(img(big))).toEqual([g(90000, 149, 149)]);
    });
  });

  describe('centroids and coordinates', () => {
    it('truncates the centroid with integer division', () => {
      expect(findConnectedGroups(img([[1, 1]]))).toEqual([g(2, 0, 0)]);
    });

    it('finds the middle of horizontal and vertical lines', () => {
      expect(findConnectedGroups(img([[1, 1, 1]]))).toEqual([g(3, 1, 0)]);
      expect(findConnectedGroups(img([[1], [1], [1]]))).toEqual([g(3, 0, 1)]);
    });

    it('maps columns to x and rows to y', () => {
      expect(findConnectedGroups(img([[0, 0, 0, 0], [0, 0, 0, 1]]))).toEqual([g(1, 3, 1)]);
    });
  });

  describe('ordering (Group.compareTo, largest first)', () => {
    it('sorts by size, biggest first', () => {
      const groups = findConnectedGroups(img([[1, 0, 1, 1, 1], [0, 0, 0, 0, 0], [1, 1, 0, 0, 0]]));
      expect(groups.map((x) => x.size)).toEqual([3, 2, 1]);
    });

    it('breaks size ties by larger x, then larger y', () => {
      const groups = findConnectedGroups(img([[1, 0, 1], [0, 0, 0], [0, 0, 1]]));
      expect(groups).toEqual([g(1, 2, 2), g(1, 2, 0), g(1, 0, 0)]);
    });
  });
});

describe('findLargestCentroid (CentroidTracker)', () => {
  it('returns the first (largest) group centroid', () => {
    expect(findLargestCentroid([g(5, 3, 4), g(2, 1, 1)])).toEqual({ x: 3, y: 4 });
  });

  it('returns (-1, -1) when there are no groups', () => {
    expect(findLargestCentroid([])).toEqual({ x: -1, y: -1 });
  });
});

describe('analyzeFrame (whole pipeline)', () => {
  it('finds the centroid of the largest matching blob', () => {
    const R = 0xff0000;
    const K = 0x000000;
    const data = rgba([
      [R, K, K, K],
      [K, K, R, R],
      [K, K, R, R],
    ]);
    const result = analyzeFrame(data, 4, 3, '#FF0000', 50);
    expect(result.groups.length).toBe(2);
    expect(result.largest).toEqual({ x: 2, y: 1 }); // (2+3+2+3)/4 = 2, (1+1+2+2)/4 = 1
    expect(result.matchingPixels).toBe(5);
  });

  it('reports (-1, -1) when nothing matches', () => {
    const result = analyzeFrame(rgba([[0x000000]]), 1, 1, '#FFFFFF', 10);
    expect(result.largest).toEqual({ x: -1, y: -1 });
  });
});

describe('color helpers', () => {
  it('converts hex strings to ints and back', () => {
    expect(hexToInt('#FFA200')).toBe(0xffa200);
    expect(hexToInt('ffa200')).toBe(0xffa200);
    expect(rgbToHex(255, 162, 0)).toBe('#FFA200');
    expect(rgbToHex(0, 5, 10)).toBe('#00050A');
  });
});
