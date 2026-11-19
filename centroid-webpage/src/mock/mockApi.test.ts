import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi, resetMockJobs, MOCK_PROCESSING_MS } from './mockApi';
import { mockVideoList } from './videos';

describe('mock API', () => {
  beforeEach(() => {
    resetMockJobs();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  // advance the fake clock and let the promise finish
  async function run<T>(promise: Promise<T>): Promise<T> {
    await vi.advanceTimersByTimeAsync(1000);
    return promise;
  }

  it('returns the mock video list', async () => {
    expect(await run(mockApi.getVideos())).toEqual(mockVideoList);
  });

  it('runs a job: processing first, then done with a CSV URL', async () => {
    const jobId = await run(mockApi.startProcessing('ensantina.mp4', '660005', 67));
    expect(await run(mockApi.getJobStatus(jobId))).toEqual({ status: 'processing' });

    await vi.advanceTimersByTimeAsync(MOCK_PROCESSING_MS);
    const status = await run(mockApi.getJobStatus(jobId));
    expect(status.status).toBe('done');
    expect(status.result).toMatch(/\.csv$/);

    const jobs = await run(mockApi.getJobs());
    expect(jobs[0]).toMatchObject({ id: jobId, fileName: 'ensantina.mp4', targetColor: '660005', threshold: 67, status: 'done' });
  });

  it('rejects a video that does not exist', async () => {
    await expect(mockApi.startProcessing('missing.mp4', '000000', 10)).rejects.toThrow('Video not found');
  });

  it('returns null for an unknown job', async () => {
    expect(await run(mockApi.getJob('nope'))).toBeNull();
  });
});
