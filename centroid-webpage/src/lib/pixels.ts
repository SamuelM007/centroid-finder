import { rgbToHex } from './centroid';

// The parts of ImageData we use, so tests can pass plain objects
export interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA, 4 bytes per pixel
}

// Reads every pixel of a loaded <img> by drawing it onto an off-screen canvas.
// Returns null if the browser can't give us a 2D canvas.
export function readImagePixels(img: HTMLImageElement): ImageData | null {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// Average color of the square of pixels around (cx, cy), as "#RRGGBB".
// radius 2 means a 5x5 square. Pixels outside the image are skipped.
// Averaging a small area is more forgiving than reading one pixel.
export function averageColorAt(pixels: Pixels, cx: number, cy: number, radius = 2): string | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      if (x < 0 || y < 0 || x >= pixels.width || y >= pixels.height) continue;
      const p = (y * pixels.width + x) * 4;
      r += pixels.data[p];
      g += pixels.data[p + 1];
      b += pixels.data[p + 2];
      n++;
    }
  }
  if (n === 0) return null;
  return rgbToHex(Math.round(r / n), Math.round(g / n), Math.round(b / n));
}

// Converts a click position on an element to pixel coordinates in an image of the
// given size that fills that element
export function clickToPixel(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: Math.floor(((clientX - rect.left) / rect.width) * width),
    y: Math.floor(((clientY - rect.top) / rect.height) * height),
  };
}
