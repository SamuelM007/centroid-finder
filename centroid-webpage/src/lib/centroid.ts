/**
 * @file TypeScript port of the Java centroid finder from the backend.
 *
 * Each function matches one Java class, so the browser preview gives the same answer
 * as the real processing job:
 *
 * | TypeScript              | Java                                                        |
 * | ----------------------- | ----------------------------------------------------------- |
 * | `euclideanDistance`     | `EuclideanColorDistance.distance`                           |
 * | `binarize`              | `DistanceImageBinarizer.toBinaryArray`                      |
 * | `findConnectedGroups`   | `DfsBinaryGroupFinder.findConnectedGroups` (+ `Group.compareTo` ordering) |
 * | `findLargestCentroid`   | `CentroidTracker.findLargestCentroid`                       |
 *
 * Images are stored as flat arrays (row-major: `index = y * width + x`) instead of
 * `int[][]`, because that's how the browser's canvas gives us pixels, and it's faster.
 */

/** A pixel position. `(-1, -1)` means "nothing found", like in the Java code. */
export interface Coordinate {
  x: number;
  y: number;
}

/** A connected group of matching pixels. Mirrors the Java `Group` record. */
export interface Group {
  /** Number of pixels in the group. */
  size: number;
  /** Average position of the group's pixels, rounded down. */
  centroid: Coordinate;
}

/** A black-and-white image: `1` = matches the target color, `0` = doesn't. */
export interface BinaryImage {
  width: number;
  height: number;
  /** One value per pixel, row by row (`index = y * width + x`). */
  pixels: Uint8Array;
}

/**
 * Straight-line distance between two colors in RGB space.
 * Same as `EuclideanColorDistance.distance` in Java.
 *
 * @param colorA a color as a `0xRRGGBB` integer
 * @param colorB a color as a `0xRRGGBB` integer
 * @returns a distance from 0 (same color) to about 441.67 (black vs. white)
 */
export function euclideanDistance(colorA: number, colorB: number): number {
  const r1 = (colorA >> 16) & 0xff;
  const g1 = (colorA >> 8) & 0xff;
  const b1 = colorA & 0xff;
  const r2 = (colorB >> 16) & 0xff;
  const g2 = (colorB >> 8) & 0xff;
  const b2 = colorB & 0xff;
  return Math.sqrt((r1 - r2) * (r1 - r2) + (g1 - g2) * (g1 - g2) + (b1 - b2) * (b1 - b2));
}

/**
 * Turns a color image into a black-and-white one: a pixel becomes `1` when it's close
 * enough to the target color. Same as `DistanceImageBinarizer.toBinaryArray` in Java.
 *
 * A pixel matches when `threshold > distance` (strictly greater, like the Java), so a
 * threshold of 0 matches nothing.
 *
 * @param rgba pixel data from a canvas (`ImageData.data`): 4 bytes per pixel (r, g, b, alpha).
 *   Alpha is ignored, like the Java code masking it off with `& 0xFFFFFF`.
 * @param width image width in pixels
 * @param height image height in pixels
 * @param targetColor the color to look for, as a `0xRRGGBB` integer
 * @param threshold maximum distance from the target color
 */
export function binarize(rgba: Uint8ClampedArray, width: number, height: number, targetColor: number, threshold: number): BinaryImage {
  const pixels = new Uint8Array(width * height);
  for (let i = 0; i < pixels.length; i++) {
    const p = i * 4;
    const color = (rgba[p] << 16) | (rgba[p + 1] << 8) | rgba[p + 2];
    if (threshold > euclideanDistance(color, targetColor)) {
      pixels[i] = 1;
    }
  }
  return { width, height, pixels };
}

/**
 * Sort comparator that puts the "biggest" group first: larger size, then larger
 * centroid x, then larger centroid y. Same order as sorting Java's `Group` with
 * `Comparator.reverseOrder()`.
 */
export function compareGroupsDescending(a: Group, b: Group): number {
  if (a.size !== b.size) return b.size - a.size;
  if (a.centroid.x !== b.centroid.x) return b.centroid.x - a.centroid.x;
  return b.centroid.y - a.centroid.y;
}

/**
 * Finds groups of `1` pixels connected up, down, left or right (not diagonally).
 * Same as `DfsBinaryGroupFinder.findConnectedGroups` in Java.
 *
 * Uses an explicit stack (an iterative depth-first search) so a big group can't overflow
 * the call stack. Each centroid is the average x and y of the group's pixels, rounded
 * down, matching Java's integer division.
 *
 * @returns the groups, biggest first (see {@link compareGroupsDescending}); empty if no pixel is `1`
 * @throws Error if the image is empty, not rectangular, or contains values other than 0 and 1
 */
export function findConnectedGroups(image: BinaryImage): Group[] {
  const { width, height, pixels } = image;
  if (width <= 0 || height <= 0 || pixels.length !== width * height) {
    throw new Error('Image must be non-empty and rectangular');
  }
  for (const v of pixels) {
    if (v !== 0 && v !== 1) throw new Error('Image may only contain 0 and 1');
  }

  const visited = new Uint8Array(pixels.length);
  const stack = new Int32Array(pixels.length);
  const groups: Group[] = [];

  for (let start = 0; start < pixels.length; start++) {
    if (pixels[start] !== 1 || visited[start] === 1) continue;

    let top = 0;
    stack[top++] = start;
    visited[start] = 1;
    let size = 0;
    let sumX = 0;
    let sumY = 0;

    while (top > 0) {
      const index = stack[--top];
      const x = index % width;
      const y = (index - x) / width;
      size++;
      sumX += x;
      sumY += y;

      // the four neighbors: right, left, down, up
      if (x + 1 < width) visit(index + 1);
      if (x > 0) visit(index - 1);
      if (y + 1 < height) visit(index + width);
      if (y > 0) visit(index - width);
    }

    groups.push({ size, centroid: { x: Math.floor(sumX / size), y: Math.floor(sumY / size) } });

    /** Pushes a neighbor onto the stack if it's a matching pixel we haven't seen yet. */
    function visit(neighbor: number) {
      if (pixels[neighbor] === 1 && visited[neighbor] === 0) {
        visited[neighbor] = 1;
        stack[top++] = neighbor;
      }
    }
  }

  groups.sort(compareGroupsDescending);
  return groups;
}

/**
 * The centroid of the largest group. Same as `CentroidTracker.findLargestCentroid` in Java.
 *
 * @param groups groups sorted biggest first, as returned by {@link findConnectedGroups}
 * @returns the first group's centroid, or `(-1, -1)` when there are no groups
 */
export function findLargestCentroid(groups: Group[]): Coordinate {
  return groups.length === 0 ? { x: -1, y: -1 } : groups[0].centroid;
}

// ---------- helpers for the UI ----------

/**
 * Converts a hex color string to an integer.
 * @param hex `"#FFA200"` or `"FFA200"`
 * @returns `0xFFA200`
 */
export function hexToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Converts red, green and blue values (0–255) to an upper-case hex string.
 * @example rgbToHex(255, 162, 0) // "#FFA200"
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Everything {@link analyzeFrame} finds in one frame. */
export interface FrameAnalysis {
  /** The black-and-white version of the frame. */
  binary: BinaryImage;
  /** Every connected group, biggest first. */
  groups: Group[];
  /** Centroid of the biggest group, or `(-1, -1)` when nothing matched. */
  largest: Coordinate;
  /** How many pixels matched the target color. */
  matchingPixels: number;
}

/**
 * Runs the whole pipeline on one frame, the same way the processor does for every frame
 * of a video: binarize, find connected groups, take the largest group's centroid.
 *
 * @param rgba pixel data from a canvas (`ImageData.data`)
 * @param width frame width in pixels
 * @param height frame height in pixels
 * @param targetHex the color to look for, e.g. `"#660005"`
 * @param threshold maximum color distance for a pixel to match (0–441)
 */
export function analyzeFrame(rgba: Uint8ClampedArray, width: number, height: number, targetHex: string, threshold: number): FrameAnalysis {
  const binary = binarize(rgba, width, height, hexToInt(targetHex), threshold);
  const groups = findConnectedGroups(binary);
  let matchingPixels = 0;
  for (const v of binary.pixels) matchingPixels += v;
  return { binary, groups, largest: findLargestCentroid(groups), matchingPixels };
}
