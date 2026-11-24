import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { drawTrack } from '../lib/drawing';
import { isMatch, matchedSegments, rowIndexAt, type TrackRow } from '../lib/csv';

export interface VideoInfo {
  width: number;
  height: number;
  duration: number;
}

interface Props {
  src: string;
  rows: TrackRow[];
  time: number; // current playback time, kept by the parent so the chart can use it too
  videoRef: RefObject<HTMLVideoElement | null>; // the parent uses it to seek
  onTimeChange: (seconds: number) => void;
  onLoaded: (info: VideoInfo) => void;
}

// The video with the tracked path and the current centroid drawn on a canvas on top,
// and a readout of the current time and position underneath
const TrackedVideo = ({ src, rows, time, videoRef, onTimeChange, onLoaded }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const segments = useMemo(() => matchedSegments(rows), [rows]);

  // Redraw on every animation frame so the dot follows the video smoothly while it plays
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas) drawTrack(canvas, video, rows, segments);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [rows, segments, videoRef]);

  const index = rowIndexAt(rows, time);
  const row = index >= 0 ? rows[index] : null;

  return (
    <section className="two-col__main player" aria-label="Video with tracked centroid">
      {failed ? (
        <div className="player__error">The video file couldn't be loaded, but the chart and CSV below still work.</div>
      ) : (
        <div className="player__frame">
          <video
            ref={videoRef}
            src={src}
            controls
            preload="auto"
            onLoadedMetadata={(e) =>
              onLoaded({ width: e.currentTarget.videoWidth, height: e.currentTarget.videoHeight, duration: e.currentTarget.duration })
            }
            onTimeUpdate={(e) => onTimeChange(e.currentTarget.currentTime)}
            onSeeked={(e) => onTimeChange(e.currentTarget.currentTime)}
            onError={() => setFailed(true)}
          />
          <canvas ref={canvasRef} className="overlay-canvas" aria-hidden="true" />
        </div>
      )}
      <div className="readout mono">
        t {time.toFixed(1)}s · {row && isMatch(row) ? `x ${row.x} · y ${row.y}` : 'no match in this frame'}
      </div>
    </section>
  );
};

export default TrackedVideo;
