import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useJob } from '../hooks/useJob';
import { useTrackCsv } from '../hooks/useTrackCsv';
import { previewUrl } from '../lib/settings';
import JobHeader from '../components/JobHeader';
import JobStepper from '../components/JobStepper';
import TrackedVideo, { type VideoInfo } from '../components/TrackedVideo';
import ResultSummary from '../components/ResultSummary';
import PositionChartCard from '../components/PositionChartCard';
import CsvPreview from '../components/CsvPreview';

/**
 * The results page at `/jobs/:jobId`.
 *
 * While the job runs, shows its progress (and keeps checking it with {@link useJob}).
 * When it's done, loads the CSV with {@link useTrackCsv} and shows the video with the
 * tracked path drawn over it, a summary with a download link, a position chart and a
 * CSV preview. If it failed, shows the error with a "Try again" link. Also handles a
 * job that doesn't exist and a lost connection.
 */
const JobResults = () => {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const { job, notFound, connectionLost } = useJob(jobId);
  const { rows, failed: csvFailed } = useTrackCsv(jobId, job?.status === 'done');

  // the video and the chart share the playback time, so it lives here
  const [time, setTime] = useState(0);
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /** Jumps the video to a time; called when the position chart is clicked. */
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

  const runAgainUrl = previewUrl(job.fileName, job.targetColor, job.threshold);
  const downloadName = `${job.fileName.replace(/\.[^.]+$/, '')}-${job.id.slice(0, 8)}.csv`;

  // chart axes: the video's length and size once it has loaded, otherwise taken from the CSV
  const lastSeconds = rows && rows.length > 0 ? rows[rows.length - 1].seconds : 0;
  const chartDuration = Math.max(lastSeconds, video && Number.isFinite(video.duration) ? video.duration : 0);
  const maxValue = video ? Math.max(video.width, video.height) : (rows ?? []).reduce((m, r) => Math.max(m, r.x, r.y), 1);

  return (
    <main className="page">
      <JobHeader job={job} runAgainUrl={runAgainUrl} />
      <JobStepper status={job.status} />

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
          <Link to={runAgainUrl} className="btn btn--danger">
            Try again
          </Link>
        </section>
      )}

      {job.status === 'done' && csvFailed && (
        <div className="notice notice--error" role="alert">
          The job finished, but its CSV couldn't be loaded.
        </div>
      )}

      {job.status === 'done' && rows && (
        <>
          <div className="two-col">
            <TrackedVideo
              src={api.videoUrl(job.fileName)}
              rows={rows}
              time={time}
              videoRef={videoRef}
              onTimeChange={setTime}
              onLoaded={setVideo}
            />
            <ResultSummary rows={rows} downloadUrl={api.resultUrl(job.id)} downloadName={downloadName} />
          </div>
          <PositionChartCard rows={rows} duration={chartDuration} maxValue={maxValue} time={time} onSeek={seek} />
          <CsvPreview rows={rows} />
        </>
      )}
    </main>
  );
};

export default JobResults;
