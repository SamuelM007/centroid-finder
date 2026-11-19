import { realApi } from './realApi';
import { mockApi } from '../mock/mockApi';
import type { Api } from './types';

export type { Api, Job, JobStatus, JobStatusResponse } from './types';

// `npm run dev:mock` sets VITE_USE_MOCK=true (see .env.mock) so the app runs without the backend
export const usingMock = import.meta.env.VITE_USE_MOCK === 'true';

export const api: Api = usingMock ? mockApi : realApi;
