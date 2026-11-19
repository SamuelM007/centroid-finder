import type { Api, Job, JobStatusResponse } from './types';

// Talks to the Spring Boot backend. In development Vite forwards /api to
// http://localhost:8080 (see vite.config.ts), so these are same-origin requests.

const enc = encodeURIComponent;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return (await res.json()) as T;
}

export const realApi: Api = {
  getVideos: () => getJson<string[]>('/api/videos'),

  getJobs: () => getJson<Job[]>('/api/jobs'),

  async getJob(jobId) {
    const res = await fetch(`/api/jobs/${enc(jobId)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Job lookup returned ${res.status}`);
    return (await res.json()) as Job;
  },

  async startProcessing(fileName, targetColor, threshold) {
    const params = new URLSearchParams({ targetColor, threshold: String(threshold) });
    const res = await fetch(`/api/process/${enc(fileName)}?${params}`, { method: 'POST' });
    const body = (await res.json().catch(() => ({}))) as { jobId?: string; error?: string };
    if (!res.ok || !body.jobId) throw new Error(body.error ?? `Server returned ${res.status}`);
    return body.jobId;
  },

  getJobStatus: (jobId) => getJson<JobStatusResponse>(`/api/process/${enc(jobId)}/status`),

  async getResultCsv(jobId) {
    const res = await fetch(`/api/result/${enc(jobId)}`);
    if (!res.ok) throw new Error(`Result returned ${res.status}`);
    return res.text();
  },

  async checkHealth() {
    try {
      return (await fetch('/api/health')).ok;
    } catch {
      return false;
    }
  },

  videoUrl: (fileName) => `/api/video/${enc(fileName)}`,
  thumbnailUrl: (fileName) => `/api/thumbnail/${enc(fileName)}`,
  resultUrl: (jobId) => `/api/result/${enc(jobId)}`,
};
