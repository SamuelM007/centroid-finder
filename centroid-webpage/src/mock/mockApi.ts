import type { Api, Job } from '../api/types';
import { mockJobs } from './jobs';
import { mockVideoList, MOCK_RESULT_URL, MOCK_THUMBNAIL_URL, MOCK_VIDEO_URL } from './videos';

// A pretend backend that keeps jobs in memory. New jobs stay "processing" for a few
// seconds and then finish, so the status tracking can be tried without the server.

export const MOCK_PROCESSING_MS = 4000;
const LATENCY_MS = 250;

const delay = <T>(value: T, ms = LATENCY_MS) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

// Same format SQLite's CURRENT_TIMESTAMP uses: "YYYY-MM-DD HH:MM:SS" in UTC
const nowUtc = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

let jobs: Job[] = mockJobs.map((j) => ({ ...j }));

// Lets tests start from the original mock data
export function resetMockJobs() {
  jobs = mockJobs.map((j) => ({ ...j }));
}

const findJob = (id: string) => jobs.find((j) => j.id === id);

export const mockApi: Api = {
  getVideos: () => delay([...mockVideoList]),

  getJobs: () => delay(jobs.map((j) => ({ ...j }))),

  getJob: (jobId) => {
    const job = findJob(jobId);
    return delay(job ? { ...job } : null);
  },

  async startProcessing(fileName, targetColor, threshold) {
    if (!mockVideoList.includes(fileName)) throw new Error(`Video not found: ${fileName}`);
    const job: Job = {
      id: crypto.randomUUID(),
      fileName,
      targetColor,
      threshold,
      status: 'processing',
      createdAt: nowUtc(),
    };
    jobs = [job, ...jobs];
    setTimeout(() => {
      job.status = 'done';
    }, MOCK_PROCESSING_MS);
    return delay(job.id);
  },

  async getJobStatus(jobId) {
    const job = findJob(jobId);
    if (!job) throw new Error('Job ID not found');
    if (job.status === 'done') return delay({ status: 'done' as const, result: MOCK_RESULT_URL });
    if (job.status === 'error') return delay({ status: 'error' as const, error: 'Error processing video' });
    return delay({ status: 'processing' as const });
  },

  async getResultCsv(jobId) {
    const job = findJob(jobId);
    if (!job || job.status !== 'done') throw new Error('Result not available for this job');
    const res = await fetch(MOCK_RESULT_URL);
    return res.text();
  },

  checkHealth: () => delay(true),

  videoUrl: () => MOCK_VIDEO_URL,
  thumbnailUrl: () => MOCK_THUMBNAIL_URL,
  resultUrl: () => MOCK_RESULT_URL,
};
