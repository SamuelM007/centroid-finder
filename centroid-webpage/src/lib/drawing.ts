import type { BinaryImage, Coordinate } from './centroid';
import { isMatch, rowIndexAt, type TrackRow } from './csv';

/** Color of the centroid dot, on the preview and on the video overlay. */
const DOT_FILL = '#F97316';

/**
 * Draws a black-and-white image onto a canvas at full size (white = `1`, black = `0`),
 * plus an orange dot at the largest group's centroid when there is one.
 * Resizes the canvas to match the image.
 *
 * @param canvas the canvas to draw on
 * @param binary the image from {@link binarize}
 * @param largest centroid to mark; `(-1, -1)` draws no dot
 */
export function paintBinary(canvas: HTMLCanvasElement, binary: BinaryImage, largest: Coordinate) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height, pixels } = binary;
  canvas.width = width;
  canvas.height = height;

  const out = ctx.createImageData(width, height);
  for (let i = 0; i < pixels.length; i++) {
    const v = pixels[i] ? 255 : 0;
    out.data[i * 4] = v;
    out.data[i * 4 + 1] = v;
    out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);

  if (largest.x !== -1) {
    ctx.beginPath();
    ctx.arc(largest.x, largest.y, Math.max(6, width / 80), 0, Math.PI * 2);
    ctx.fillStyle = DOT_FILL;
    ctx.fill();
    ctx.lineWidth = Math.max(2, width / 400);
    ctx.strokeStyle = '#18181B';
    ctx.stroke();
  }
}

// Draws the whole tracked path, plus a dot at the centroid for the video's current time,
// on a canvas laid over the video. CSV coordinates are in video pixels, so they are
// scaled to the size the video is shown at.
export function drawTrack(canvas: HTMLCanvasElement, video: HTMLVideoElement, rows: TrackRow[], segments: TrackRow[][]) {
  if (!video.videoWidth) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // match the canvas to the displayed video size (times the screen's pixel density, so it stays sharp)
  const dpr = window.devicePixelRatio || 1;
  const cw = video.clientWidth;
  const ch = video.clientHeight;
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);

  const sx = cw / video.videoWidth;
  const sy = ch / video.videoHeight;

  // the path, one line per run of frames where the object was found
  ctx.strokeStyle = 'rgba(253, 186, 116, 0.75)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  for (const seg of segments) {
    ctx.beginPath();
    seg.forEach((r, i) => (i === 0 ? ctx.moveTo(r.x * sx, r.y * sy) : ctx.lineTo(r.x * sx, r.y * sy)));
    ctx.stroke();
  }

  // the dot for the current frame
  const idx = rowIndexAt(rows, video.currentTime);
  const row = idx >= 0 ? rows[idx] : null;
  if (row && isMatch(row)) {
    ctx.beginPath();
    ctx.arc(row.x * sx, row.y * sy, 8, 0, Math.PI * 2);
    ctx.fillStyle = DOT_FILL;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
  }
}
