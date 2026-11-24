import type { Job } from '../api/types';

/**
 * Jobs the mock backend starts with, shaped like `GET /api/jobs` (newest first):
 * one finished job using the real sample CSV, and one failed job.
 */
export const mockJobs: Job[] = [
  {
    id: '2348f737-65e8-4442-889b-9cf95d70ae7d',
    fileName: 'ensantina.mp4',
    targetColor: '660005',
    threshold: 67,
    status: 'done',
    createdAt: '2026-11-19 07:24:42',
  },
  {
    id: '8c2c661b-c4d1-4b40-b833-0ab80402c6fa',
    fileName: 'ensantina.mp4',
    targetColor: 'FFA200',
    threshold: 164,
    status: 'error',
    createdAt: '2026-11-19 06:57:43',
  },
];
