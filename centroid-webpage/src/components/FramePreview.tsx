import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { analyzeFrame, rgbToHex, type Coordinate } from '../lib/centroid';

export interface PreviewStats {
  matchingPercent: number;
  groups: number;
  largest: Coordinate; // (-1, -1) when nothing matched
}

interface Props {
  thumbnailUrl: string;
  color: string; // "#RRGGBB"
  threshold: number;
  onPickColor: (hex: string) => void;
  onStats: (stats: PreviewStats) => void;
  onFrameLoaded: (rgba: Uint8ClampedArray) => void;
}

// Shows the video's first frame next to its binarized version. The binarized image is
// recomputed at full resolution whenever the color or threshold changes, using the same
// logic as the Java processor, and a dot marks the centroid of the largest group.
const FramePreview = ({ thumbnailUrl, color, threshold, onPickColor, onStats, onFrameLoaded }: Props) => {
  const [frame, setFrame] = useState<ImageData | null>(null);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const binaryRef = useRef<HTMLCanvasElement>(null);

  // When the thumbnail has loaded, read its pixels once
  const handleLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setFrame(data);
    onFrameLoaded(data.data);
  };

  // Re-run the binarization whenever the frame, color or threshold changes.
  // requestAnimationFrame keeps dragging the slider smooth: at most one run per screen refresh.
  useEffect(() => {
    if (!frame) return;
    const raf = requestAnimationFrame(() => {
      const { width, height } = frame;
      const result = analyzeFrame(frame.data, width, height, color, threshold);

      const canvas = binaryRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        canvas.width = width;
        canvas.height = height;
        const out = ctx.createImageData(width, height);
        for (let i = 0; i < result.binary.pixels.length; i++) {
          const v = result.binary.pixels[i] ? 255 : 0;
          out.data[i * 4] = v;
          out.data[i * 4 + 1] = v;
          out.data[i * 4 + 2] = v;
          out.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(out, 0, 0);

        if (result.largest.x !== -1) {
          ctx.beginPath();
          ctx.arc(result.largest.x, result.largest.y, Math.max(6, width / 80), 0, Math.PI * 2);
          ctx.fillStyle = '#F97316';
          ctx.fill();
          ctx.lineWidth = Math.max(2, width / 400);
          ctx.strokeStyle = '#18181B';
          ctx.stroke();
        }
      }

      onStats({
        matchingPercent: (result.matchingPixels / (width * height)) * 100,
        groups: result.groups.length,
        largest: result.largest,
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [frame, color, threshold, onStats]);

  // Clicking the original frame picks the average color of the 5x5 pixels under the cursor
  const pickColor = (e: MouseEvent<HTMLButtonElement>) => {
    if (!frame) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = Math.floor(((e.clientX - rect.left) / rect.width) * frame.width);
    const cy = Math.floor(((e.clientY - rect.top) / rect.height) * frame.height);
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let y = cy - 2; y <= cy + 2; y++) {
      for (let x = cx - 2; x <= cx + 2; x++) {
        if (x < 0 || y < 0 || x >= frame.width || y >= frame.height) continue;
        const p = (y * frame.width + x) * 4;
        r += frame.data[p];
        g += frame.data[p + 1];
        b += frame.data[p + 2];
        n++;
      }
    }
    if (n > 0) onPickColor(rgbToHex(Math.round(r / n), Math.round(g / n), Math.round(b / n)));
  };

  if (failed) {
    return (
      <div className="notice notice--error" role="alert">
        Couldn't load the first frame of this video.
      </div>
    );
  }

  return (
    <div className="frame-pair">
      <figure className="frame">
        <button type="button" className="frame__pick" onClick={pickColor} disabled={!frame} aria-label="Pick the target color from the first frame">
          <img ref={imgRef} src={thumbnailUrl} alt="First frame of the video" onLoad={handleLoad} onError={() => setFailed(true)} />
        </button>
        <figcaption className="muted small">First frame · click it to pick a color</figcaption>
      </figure>
      <figure className="frame">
        <canvas ref={binaryRef} className="frame__canvas" role="img" aria-label="Binarized frame: white pixels are close to the target color" />
        <figcaption className="muted small">Binarized · white = within the threshold · dot = largest group's centroid</figcaption>
      </figure>
    </div>
  );
};

export default FramePreview;
