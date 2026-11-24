import { rgbToHex } from './centroid';

/**
 * Finds the most common distinct colors in an image. Used for the preset swatches on
 * the preview page.
 *
 * Pixels are grouped into buckets (16 levels per channel, so 4096 buckets), the buckets
 * are ranked by how many pixels fall in them, and each bucket's color is the average of
 * its pixels. A color closer than `minDistance` to one already picked is skipped, so the
 * result isn't five shades of the same background.
 *
 * @param rgba pixel data from a canvas (`ImageData.data`)
 * @param count how many colors to return at most
 * @param minDistance smallest allowed color distance between two returned colors
 * @returns colors as `"#RRGGBB"`, most common first
 */
export function dominantColors(rgba: Uint8ClampedArray, count = 5, minDistance = 60): string[] {
  const BUCKETS = 16 * 16 * 16;
  const counts = new Uint32Array(BUCKETS);
  const sumR = new Float64Array(BUCKETS);
  const sumG = new Float64Array(BUCKETS);
  const sumB = new Float64Array(BUCKETS);

  for (let p = 0; p < rgba.length; p += 4) {
    const r = rgba[p];
    const g = rgba[p + 1];
    const b = rgba[p + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    counts[key]++;
    sumR[key] += r;
    sumG[key] += g;
    sumB[key] += b;
  }

  const ranked: number[] = [];
  for (let k = 0; k < BUCKETS; k++) if (counts[k] > 0) ranked.push(k);
  ranked.sort((a, b) => counts[b] - counts[a]);

  const picked: Array<[number, number, number]> = [];
  for (const k of ranked) {
    const n = counts[k];
    const c: [number, number, number] = [Math.round(sumR[k] / n), Math.round(sumG[k] / n), Math.round(sumB[k] / n)];
    const tooClose = picked.some(([r, g, b]) => Math.hypot(r - c[0], g - c[1], b - c[2]) < minDistance);
    if (!tooClose) picked.push(c);
    if (picked.length === count) break;
  }
  return picked.map(([r, g, b]) => rgbToHex(r, g, b));
}
