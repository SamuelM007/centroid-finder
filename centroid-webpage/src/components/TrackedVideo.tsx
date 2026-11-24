import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { drawTrack } from '../lib/drawing';
import { isMatch, matchedSegments, rowIndexAt, type TrackRow } from '../lib/csv';

/** The video's real size and length, known once it has loaded. */
export interface VideoInfo {
  /** Width in pixels. */
  width: number;
  /** Height in pixels. */
  height: number;
  /** Length in seconds. */
  duration: number;
}

interface Props {
  /** URL of the video. */
  src: string;
  /** The job's CSV rows, used to draw the path and the dot. */
  rows: TrackRow[];
  /** Current playback time in seconds. Kept by the parent so the chart can use it too. */
  time: number;
  /** Ref to the `<video>` element. The parent uses it to jump to a time when the chart is clicked. */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Called with the new time while the video plays or after a jump. */
  onTimeChange: (seconds: number) => void;
  /** Called once the video's size and length are known. */
  onLoaded: (info: VideoInfo) => void;
}

/**
 * The results page's video, with the whole tracked path and a dot at the current
 * centroid drawn on a canvas laid over it, plus a readout of the current time and
 * position underneath. If the video can't be loaded, shows a message instead; the chart
 * and CSV still work without it.
 */
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
