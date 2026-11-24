import type { Api, Job, JobStatusResponse } from './types';

/**
 * @file The real API client: talks to the Spring Boot backend.
 * In development, Vite forwards `/api` to http://localhost:8080 (see `vite.config.ts`),
 * so these are same-origin requests and need no CORS setup.
 */

const enc = encodeURIComponent;

/**
 * Fetches a URL and parses the response as JSON.
 * @throws Error if the response status isn't 2xx
 */
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return (await res.json()) as T;
}

/** {@link Api} implementation that calls the backend over HTTP. */
export const realApi: Api = {
  getVideos: () => getJson<string[]>('/api/videos'),

  getJobs: () => getJson<Job[]>('/api/jobs'),

  async getJob(jobId) {
    const res = await fetch(`/api/jobs/${enc(jobId)}`);
    // 404 = no such job, 400 = not even a valid job ID; both mean "not found" to the page
    if (res.status === 404 || res.status === 400) return null;
    if (!res.ok) throw new Error(`Job lookup returned ${res.status}`);
    return (await res.json()) as Job;
  },

  async startProcessing(fileName, targetColor, threshold) {
    const params = new URLSearchParams({ targetColor, threshold: String(threshold) });
    const res = await fetch(`/api/process/${enc(fileName)}?${params}`, { method: 'POST' });
    // the server sends {"jobId"} on success and {"error"} on failure
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
      // network error: the server isn't running
      return false;
    }
  },

  videoUrl: (fileName) => `/api/video/${enc(fileName)}`,
  thumbnailUrl: (fileName) => `/api/thumbnail/${enc(fileName)}`,
  resultUrl: (jobId) => `/api/result/${enc(jobId)}`,
};
