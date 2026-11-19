// JavaScript (TypeScript) port of the Java centroid finder from the backend.
// Each function matches one Java class so the browser preview gives the same
// answer as the real processing job:
//
//   euclideanDistance    <- EuclideanColorDistance.distance
//   binarize             <- DistanceImageBinarizer.toBinaryArray
//   findConnectedGroups  <- DfsBinaryGroupFinder.findConnectedGroups (+ Group.compareTo ordering)
//   findLargestCentroid  <- CentroidTracker.findLargestCentroid
//
// Images are stored as flat arrays (row-major: index = y * width + x) instead of int[][]
// because that is how the browser's canvas gives us pixels, and it is much faster.

export interface Coordinate {
  x: number;
  y: number;
}

export interface Group {
  size: number;
  centroid: Coordinate;
}

// A binary image: 1 = matches the target color, 0 = doesn't
export interface BinaryImage {
  width: number;
  height: number;
  pixels: Uint8Array;
}

// Colors are 0xRRGGBB integers, like in the Java code
export function euclideanDistance(colorA: number, colorB: number): number {
  const r1 = (colorA >> 16) & 0xff;
  const g1 = (colorA >> 8) & 0xff;
  const b1 = colorA & 0xff;
  const r2 = (colorB >> 16) & 0xff;
  const g2 = (colorB >> 8) & 0xff;
  const b2 = colorB & 0xff;
  return Math.sqrt((r1 - r2) * (r1 - r2) + (g1 - g2) * (g1 - g2) + (b1 - b2) * (b1 - b2));
}

// rgba is canvas ImageData.data: 4 bytes (r, g, b, alpha) per pixel. Alpha is ignored,
// just like the Java code masks it off with & 0xFFFFFF.
// A pixel is white when threshold > distance (strictly greater, same as the Java).
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

// Same ordering as Group.compareTo in Java, reversed (largest first):
// bigger size first, then bigger centroid x, then bigger centroid y
export function compareGroupsDescending(a: Group, b: Group): number {
  if (a.size !== b.size) return b.size - a.size;
  if (a.centroid.x !== b.centroid.x) return b.centroid.x - a.centroid.x;
  return b.centroid.y - a.centroid.y;
}

// Finds groups of 1-pixels connected up/down/left/right (not diagonally).
// Uses an explicit stack (an iterative DFS) like DfsBinaryGroupFinder, so big groups
// can't overflow the call stack. The centroid is the integer average of the x and y
// coordinates (Java integer division truncates, which is Math.floor for positives).
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

// Centroid of the largest group, or (-1, -1) when nothing matched, like CentroidTracker
export function findLargestCentroid(groups: Group[]): Coordinate {
  return groups.length === 0 ? { x: -1, y: -1 } : groups[0].centroid;
}

// ---------- helpers for the UI ----------

// "#FFA200" or "FFA200" -> 0xFFA200
export function hexToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export interface FrameAnalysis {
  binary: BinaryImage;
  groups: Group[];
  largest: Coordinate; // (-1, -1) when nothing matched
  matchingPixels: number;
}

// Runs the whole pipeline on one frame, the way the processor does for every frame
export function analyzeFrame(rgba: Uint8ClampedArray, width: number, height: number, targetHex: string, threshold: number): FrameAnalysis {
  const binary = binarize(rgba, width, height, hexToInt(targetHex), threshold);
  const groups = findConnectedGroups(binary);
  let matchingPixels = 0;
  for (const v of binary.pixels) matchingPixels += v;
  return { binary, groups, largest: findLargestCentroid(groups), matchingPixels };
}
