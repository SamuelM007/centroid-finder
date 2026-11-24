import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { analyzeFrame } from '../lib/centroid';
import { paintBinary } from '../lib/drawing';
import { averageColorAt, clickToPixel, readImagePixels } from '../lib/pixels';
import type { PreviewStats } from '../lib/previewHint';

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
    if (!imgRef.current) return;
    const pixels = readImagePixels(imgRef.current);
    if (!pixels) return;
    setFrame(pixels);
    onFrameLoaded(pixels.data);
  };

  // Re-run the binarization whenever the frame, color or threshold changes.
  // requestAnimationFrame keeps dragging the slider smooth: at most one run per screen refresh.
  useEffect(() => {
    if (!frame) return;
    const raf = requestAnimationFrame(() => {
      const { width, height } = frame;
      const result = analyzeFrame(frame.data, width, height, color, threshold);
      if (binaryRef.current) paintBinary(binaryRef.current, result.binary, result.largest);
      onStats({
        matchingPercent: (result.matchingPixels / (width * height)) * 100,
        groups: result.groups.length,
        largest: result.largest,
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [frame, color, threshold, onStats]);

  // Clicking the original frame picks the color under the cursor
  const pickColor = (e: MouseEvent<HTMLButtonElement>) => {
    if (!frame) return;
    const { x, y } = clickToPixel(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect(), frame.width, frame.height);
    const hex = averageColorAt(frame, x, y);
    if (hex) onPickColor(hex);
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
