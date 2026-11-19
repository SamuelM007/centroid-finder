import { useMemo, useState } from 'react';
import VideoCard from '../components/VideoCard';
import { withData, type WithDataProps } from '../hoc/withData';
import { api, type Job, type JobStatus } from '../api';

interface ChooserData {
  videos: string[];
  jobs: Job[];
}

// Job statuses are a bonus: if /api/jobs fails, still show the videos
const loadVideos = async (): Promise<ChooserData> => {
  const [videos, jobs] = await Promise.all([api.getVideos(), api.getJobs().catch(() => [] as Job[])]);
  return { videos, jobs };
};

type GridProps = WithDataProps<ChooserData> & { filter: string };

function VideoGrid({ data, filter }: GridProps) {
  // jobs come newest first, so the first job seen for a video is its latest run
  const lastStatus = useMemo(() => {
    const map = new Map<string, JobStatus>();
    for (const job of data.jobs) {
      if (!map.has(job.fileName)) map.set(job.fileName, job.status);
    }
    return map;
  }, [data.jobs]);

  if (data.videos.length === 0) {
    return (
      <div className="notice">
        No videos yet. Add video files to the backend's <code>videos/</code> folder and refresh.
      </div>
    );
  }

  const shown = data.videos.filter((name) => name.toLowerCase().includes(filter.trim().toLowerCase()));
  if (shown.length === 0) return <div className="notice">No videos match “{filter}”.</div>;

  return (
    <ul className="video-grid" aria-label="Available videos">
      {shown.map((name) => (
        <li key={name}>
          <VideoCard fileName={name} lastStatus={lastStatus.get(name) ?? 'none'} />
        </li>
      ))}
    </ul>
  );
}

// the HOC does the fetching and the loading / error states
const VideoGridWithData = withData<ChooserData, { filter: string }>(VideoGrid, loadVideos, {
  loadingMessage: 'Loading videos…',
});

const VideoChooser = () => {
  const [filter, setFilter] = useState('');
  return (
    <main className="page">
      <div className="page-head">
        <div className="page-head__text">
          <h1>Videos</h1>
          <p className="muted">Pick a video to choose a target color and track its centroid frame by frame.</p>
        </div>
        <div className="field field--search">
          <label htmlFor="filter">Filter videos</label>
          <input id="filter" type="search" placeholder="Search by file name" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </div>
      <VideoGridWithData filter={filter} />
    </main>
  );
};

export default VideoChooser;
