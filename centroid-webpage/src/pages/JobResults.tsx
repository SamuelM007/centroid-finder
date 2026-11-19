import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Job } from '../api';
import { isMatch, matchedSegments, parseTrackCsv, rowIndexAt, type TrackRow } from '../lib/csv';
import { formatDuration, formatStarted } from '../lib/format';
import PositionChart from '../components/PositionChart';

const POLL_MS = 2000;
const CSV_PREVIEW_ROWS = 8;

// /jobs/:jobId — job progress, then the tracked path drawn over the video,
// an x/y chart, a CSV preview and a download link
const JobResults = () => {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const [rows, setRows] = useState<TrackRow[] | null>(null);
  const [csvError, setCsvError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [time, setTime] = useState(0);
  const [dims, setDims] = useState<{ w: number; h: number; duration: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load the job, then keep checking every 2 seconds while it's still processing
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      try {
        const j = await api.getJob(jobId);
        if (cancelled) return;
        setConnectionLost(false);
        if (!j) {
          setNotFound(true);
          return;
        }
        setJob(j);
        if (j.status === 'processing') timer = setTimeout(tick, POLL_MS);
      } catch {
        if (cancelled) return;
        setConnectionLost(true);
        timer = setTimeout(tick, POLL_MS * 2);
      }
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId]);

  const status = job?.status;

  // Once it's done, download and parse the CSV
  useEffect(() => {
    if (status !== 'done') return;
    let cancelled = false;
    api
      .getResultCsv(jobId)
      .then((text) => {
        if (!cancelled) setRows(parseTrackCsv(text));
      })
      .catch(() => {
        if (!cancelled) setCsvError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, status]);

  const segments = useMemo(() => (rows ? matchedSegments(rows) : []), [rows]);

  // Draw the tracked path and the current centroid over the video
  const drawOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !rows || !video.videoWidth) return;
    const dpr = window.devicePixelRatio || 1;
    const cw = video.clientWidth;
    const ch = video.clientHeight;
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    const sx = cw / video.videoWidth;
    const sy = ch / video.videoHeight;

    ctx.strokeStyle = 'rgba(253, 186, 116, 0.75)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    for (const seg of segments) {
      ctx.beginPath();
      seg.forEach((r, i) => (i === 0 ? ctx.moveTo(r.x * sx, r.y * sy) : ctx.lineTo(r.x * sx, r.y * sy)));
      ctx.stroke();
    }

    const idx = rowIndexAt(rows, video.currentTime);
    const row = idx >= 0 ? rows[idx] : null;
    if (row && isMatch(row)) {
      ctx.beginPath();
      ctx.arc(row.x * sx, row.y * sy, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#F97316';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    }
  }, [rows, segments]);

  // Redraw every animation frame so the dot follows the video smoothly
  useEffect(() => {
    if (!rows) return;
    let raf = 0;
    const loop = () => {
      drawOverlay();
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [rows, drawOverlay]);

  const seek = (seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime = seconds;
    setTime(seconds);
  };

  if (notFound) {
    return (
      <main className="page">
        <h1>Job not found</h1>
        <p className="muted">
          There's no job with this ID. <Link to="/jobs">See all jobs</Link>
        </p>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="page">
        <p className="muted" role="status">
          {connectionLost ? "Can't reach the server. Retrying…" : 'Loading job…'}
        </p>
      </main>
    );
  }

  const steps = [
    { label: 'Started', sub: 'Job created', state: 'done' },
    {
      label: 'Processing',
      sub: job.status === 'error' ? 'Exited with an error' : job.status === 'done' ? 'All frames read' : 'Reading frames',
      state: job.status === 'processing' ? 'active' : job.status === 'error' ? 'error' : 'done',
    },
    { label: 'Results ready', sub: job.status === 'done' ? 'CSV saved' : 'Waiting', state: job.status === 'done' ? 'done' : 'idle' },
  ];

  const matched = rows ? rows.filter(isMatch).length : 0;
  const lastSeconds = rows && rows.length > 0 ? rows[rows.length - 1].seconds : 0;
  const chartDuration = Math.max(lastSeconds, dims && Number.isFinite(dims.duration) ? dims.duration : 0);
  const maxValue = dims ? Math.max(dims.w, dims.h) : rows ? rows.reduce((m, r) => Math.max(m, r.x, r.y), 1) : 1;
  const currentIndex = rows ? rowIndexAt(rows, time) : -1;
  const currentRow = rows && currentIndex >= 0 ? rows[currentIndex] : null;
  const runAgain = `/preview/${encodeURIComponent(job.fileName)}?color=${job.targetColor}&threshold=${job.threshold}`;
  const downloadName = `${job.fileName.replace(/\.[^.]+$/, '')}-${job.id.slice(0, 8)}.csv`;

  return (
    <main className="page">
      <div className="page-head">
        <div className="page-head__text">
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <Link to="/jobs">Jobs</Link>
            <span aria-hidden="true">/</span>
            <span className="mono">{job.id.slice(0, 8)}</span>
          </nav>
          <h1>{job.fileName}</h1>
          <div className="meta-row">
            <span className="meta-item">
              Target <span className="color-chip" style={{ background: `#${job.targetColor}` }} aria-hidden="true" />
              <span className="mono strong">{job.targetColor.toUpperCase()}</span>
            </span>
            <span className="meta-item">
              Threshold <span className="mono strong">{job.threshold}</span>
            </span>
            <span className="meta-item">Started {formatStarted(job.createdAt)}</span>
          </div>
        </div>
        <Link to={runAgain} className="btn btn--secondary">
          Run again with new settings
        </Link>
      </div>

      <ol className="stepper card" aria-label="Job progress">
        {steps.map((s, i) => (
          <li key={s.label} className={`stepper__step stepper__step--${s.state}`}>
            <span className="stepper__mark">{s.state === 'done' ? '✓' : s.state === 'error' ? '!' : i + 1}</span>
            <span className="stepper__text">
              <span className="strong">{s.label}</span>
              <span className="muted small">{s.sub}</span>
            </span>
          </li>
        ))}
      </ol>

      {connectionLost && (
        <div className="notice notice--error" role="alert">
          Lost connection to the server. Retrying…
        </div>
      )}

      {job.status === 'processing' && (
        <section className="card processing">
          <span className="spinner" aria-hidden="true" />
          <h2>Tracking the centroid in every frame…</h2>
          <p className="muted">
            This page checks the job every 2 seconds. You can leave and come back. The job keeps running and its status is saved.
          </p>
        </section>
      )}

      {job.status === 'error' && (
        <section className="notice notice--error notice--big" role="alert">
          <div>
            <h2>Processing failed</h2>
            <p>The processor exited with an error, or the server restarted while it was running. Check the settings and try again.</p>
          </div>
          <Link to={runAgain} className="btn btn--danger">
            Try again
          </Link>
        </section>
      )}

      {job.status === 'done' && csvError && (
        <div className="notice notice--error" role="alert">
          The job finished, but its CSV couldn't be loaded.
        </div>
      )}

      {job.status === 'done' && rows && (
        <>
          <div className="two-col">
            <section className="two-col__main player" aria-label="Video with tracked centroid">
              {videoError ? (
                <div className="player__error">The video file couldn't be loaded, but the chart and CSV below still work.</div>
              ) : (
                <div className="player__frame">
                  <video
                    ref={videoRef}
                    src={api.videoUrl(job.fileName)}
                    controls
                    preload="auto"
                    onLoadedMetadata={(e) =>
                      setDims({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight, duration: e.currentTarget.duration })
                    }
                    onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                    onSeeked={(e) => setTime(e.currentTarget.currentTime)}
                    onError={() => setVideoError(true)}
                  />
                  <canvas ref={canvasRef} className="overlay-canvas" aria-hidden="true" />
                </div>
              )}
              <div className="readout mono">
                t {time.toFixed(1)}s · {currentRow && isMatch(currentRow) ? `x ${currentRow.x} · y ${currentRow.y}` : 'no match in this frame'}
              </div>
            </section>

            <aside className="two-col__side card stack">
              <h2>Summary</h2>
              <div className="stat-grid">
                <div className="stat">
                  <span className="muted small">Frames</span>
                  <span className="stat__value">{rows.length}</span>
                </div>
                <div className="stat">
                  <span className="muted small">Tracked</span>
                  <span className="stat__value">{rows.length ? Math.round((matched / rows.length) * 100) : 0}%</span>
                </div>
                <div className="stat">
                  <span className="muted small">No match</span>
                  <span className="stat__value">{rows.length - matched}</span>
                </div>
                <div className="stat">
                  <span className="muted small">Duration</span>
                  <span className="stat__value">{formatDuration(lastSeconds)}</span>
                </div>
              </div>
              <a href={api.resultUrl(job.id)} download={downloadName} className="btn btn--primary btn--lg push-bottom">
                Download CSV
              </a>
            </aside>
          </div>

          <section className="card stack">
            <div className="card__head">
              <h2>Position over time</h2>
              <div className="legend">
                <span className="legend__item">
                  <span className="legend__line legend__line--x" />x
                </span>
                <span className="legend__item">
                  <span className="legend__line legend__line--y" />y
                </span>
                <span className="legend__item">
                  <span className="legend__gap" />
                  No match (−1, −1)
                </span>
              </div>
            </div>
            <PositionChart rows={rows} duration={chartDuration} maxValue={maxValue} time={time} onSeek={seek} />
            <p className="muted small">Click the chart to jump the video to that moment. The dark line marks the current time.</p>
          </section>

          <section className="card stack">
            <div className="card__head">
              <h2>CSV preview</h2>
              <span className="muted small">
                Showing {Math.min(CSV_PREVIEW_ROWS, rows.length)} of {rows.length} rows
              </span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">seconds</th>
                    <th scope="col">x</th>
                    <th scope="col">y</th>
                    <th scope="col">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, CSV_PREVIEW_ROWS).map((r) => (
                    <tr key={r.seconds}>
                      <td className="mono">{r.seconds}</td>
                      <td className="mono">{r.x}</td>
                      <td className="mono">{r.y}</td>
                      <td className="muted">{isMatch(r) ? '' : 'No match in this frame'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default JobResults;
