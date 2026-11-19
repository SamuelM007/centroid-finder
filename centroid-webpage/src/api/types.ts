export type JobStatus = 'processing' | 'done' | 'error';

// One row of the backend's jobs table (GET /api/jobs, GET /api/jobs/{id})
export interface Job {
  id: string;
  fileName: string;
  targetColor: string; // RRGGBB, no '#'
  threshold: number;
  status: JobStatus;
  createdAt: string; // UTC, "YYYY-MM-DD HH:MM:SS"
}

// GET /api/process/{jobId}/status
export interface JobStatusResponse {
  status: JobStatus;
  result?: string; // URL of the CSV, once done
  error?: string;
}

// Everything the pages need from the backend. There are two implementations:
// realApi (talks to the Spring Boot server) and mockApi (uses local mock data).
export interface Api {
  getVideos(): Promise<string[]>;
  getJobs(): Promise<Job[]>;
  getJob(jobId: string): Promise<Job | null>; // null = no such job
  startProcessing(fileName: string, targetColor: string, threshold: number): Promise<string>; // resolves to jobId
  getJobStatus(jobId: string): Promise<JobStatusResponse>;
  getResultCsv(jobId: string): Promise<string>;
  checkHealth(): Promise<boolean>;
  videoUrl(fileName: string): string;
  thumbnailUrl(fileName: string): string;
  resultUrl(jobId: string): string;
}
