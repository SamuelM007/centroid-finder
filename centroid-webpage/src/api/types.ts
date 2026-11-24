/** Where a processing job is: still running, finished with a CSV, or failed. */
export type JobStatus = 'processing' | 'done' | 'error';

/** One row of the backend's jobs table, as returned by `GET /api/jobs` and `GET /api/jobs/{id}`. */
export interface Job {
  /** UUID the server created when the job started. */
  id: string;
  /** Name of the video in the server's `videos/` folder. */
  fileName: string;
  /** Target color as six hex digits, without `#` (e.g. `"660005"`). */
  targetColor: string;
  /** Maximum color distance (0–441) for a pixel to count as a match. */
  threshold: number;
  status: JobStatus;
  /** When the job started, in UTC, formatted `"YYYY-MM-DD HH:MM:SS"` (SQLite's format). */
  createdAt: string;
}

/** Response of `GET /api/process/{jobId}/status`. */
export interface JobStatusResponse {
  status: JobStatus;
  /** URL of the result CSV. Only present when `status` is `"done"`. */
  result?: string;
  /** Error message. Only present when `status` is `"error"`. */
  error?: string;
}

/**
 * Everything the pages need from the backend.
 *
 * There are two implementations with the same methods: `realApi`, which calls the
 * Spring Boot server, and `mockApi`, which uses local mock data. Pages import `api`
 * from `api/index.ts` and never need to know which one they got.
 */
export interface Api {
  /** File names of the available videos. */
  getVideos(): Promise<string[]>;
  /** Every job, newest first. */
  getJobs(): Promise<Job[]>;
  /** One job, or `null` if there's no job with this ID. */
  getJob(jobId: string): Promise<Job | null>;
  /**
   * Starts processing a video with the given settings.
   * @param targetColor six hex digits without `#`
   * @returns the new job's ID
   * @throws Error with the server's message if the job couldn't be started
   */
  startProcessing(fileName: string, targetColor: string, threshold: number): Promise<string>;
  /** A job's current status, plus the CSV URL once it's done. */
  getJobStatus(jobId: string): Promise<JobStatusResponse>;
  /** The text of a finished job's CSV (`seconds,x,y` per frame). */
  getResultCsv(jobId: string): Promise<string>;
  /** True if the server answers `GET /api/health`. Never throws. */
  checkHealth(): Promise<boolean>;
  /** URL to play a video in a `<video>` element. */
  videoUrl(fileName: string): string;
  /** URL of a video's first frame as an image. */
  thumbnailUrl(fileName: string): string;
  /** URL to download a job's CSV. */
  resultUrl(jobId: string): string;
}
