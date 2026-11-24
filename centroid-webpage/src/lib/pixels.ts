import { rgbToHex } from './centroid';

/**
 * The parts of `ImageData` these helpers use. A separate type so tests can pass a plain
 * object instead of creating real `ImageData`.
 */
export interface Pixels {
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel, row by row. */
  data: Uint8ClampedArray;
}

/**
 * Reads every pixel of a loaded `<img>` by drawing it onto an off-screen canvas.
 * The image must be from the same origin, or the browser blocks reading its pixels.
 *
 * @returns the pixels at the image's full size, or `null` if the browser can't make a 2D canvas
 */
export function readImagePixels(img: HTMLImageElement): ImageData | null {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Average color of the square of pixels around a point. Averaging a small area is more
 * forgiving than reading a single pixel. Pixels outside the image are skipped.
 *
 * @param cx x of the center pixel
 * @param cy y of the center pixel
 * @param radius how far to reach in each direction; 2 means a 5×5 square
 * @returns the color as `"#RRGGBB"`, or `null` if the square is entirely outside the image
 */
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

/**
 * Converts a click on an element to pixel coordinates in the image shown in it.
 * Assumes the image fills the element, which may be shown smaller or larger than the
 * image's real size.
 *
 * @param clientX the click's x, from the mouse event
 * @param clientY the click's y, from the mouse event
 * @param rect the element's position and size, from `getBoundingClientRect()`
 * @param width the image's real width in pixels
 * @param height the image's real height in pixels
 */
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
