import { realApi } from './realApi';
import { mockApi } from '../mock/mockApi';
import type { Api } from './types';

export type { Api, Job, JobStatus, JobStatusResponse } from './types';

/**
 * True when the app runs on mock data instead of the backend.
 * `npm run dev:mock` sets `VITE_USE_MOCK=true` (see `.env.mock`).
 */
export const usingMock = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * The API client every page uses: {@link mockApi} in mock mode, otherwise {@link realApi}.
 * Both have the same methods, so pages work the same either way.
 */
export const api: Api = usingMock ? mockApi : realApi;
