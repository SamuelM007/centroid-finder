import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JobResults from './JobResults';
import { mockFetch } from '../test/fetchMock';
import type { Job } from '../api';

const job: Job = {
  id: 'abc12345-0000-0000-0000-000000000000',
  fileName: 'ensantina.mp4',
  targetColor: '660005',
  threshold: 67,
  status: 'done',
  createdAt: '2026-11-19 07:24:42',
};

const CSV = '0.0,223,419\n0.5,222,421\n1.0,-1,-1\n1.5,230,430\n';

const renderAt = (id: string) =>
  render(
    <MemoryRouter initialEntries={[`/jobs/${id}`]}>
      <Routes>
        <Route path="/jobs/:jobId" element={<JobResults />} />
      </Routes>
    </MemoryRouter>,
  );

afterEach(() => vi.unstubAllGlobals());

describe('Job results page', () => {
  it('shows the summary, CSV preview and download link for a finished job', async () => {
    mockFetch({ [`GET /api/jobs/${job.id}`]: () => job, [`GET /api/result/${job.id}`]: () => CSV });
    renderAt(job.id);

    expect(await screen.findByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByText('Frames').nextElementSibling).toHaveTextContent('4');
    expect(screen.getByText('Tracked').nextElementSibling).toHaveTextContent('75%');
    expect(screen.getByText('Showing 4 of 4 rows')).toBeInTheDocument();
    expect(screen.getByText('No match in this frame')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download CSV' })).toHaveAttribute('href', `/api/result/${job.id}`);
    expect(screen.getByRole('link', { name: 'Run again with new settings' })).toHaveAttribute(
      'href',
      '/preview/ensantina.mp4?color=660005&threshold=67',
    );
  });

  it('shows the processing state while the job is running', async () => {
    mockFetch({ [`GET /api/jobs/${job.id}`]: () => ({ ...job, status: 'processing' }) });
    renderAt(job.id);
    expect(await screen.findByText('Tracking the centroid in every frame…')).toBeInTheDocument();
  });

  it('shows the error state with a Try again link', async () => {
    mockFetch({ [`GET /api/jobs/${job.id}`]: () => ({ ...job, status: 'error' }) });
    renderAt(job.id);
    expect(await screen.findByRole('heading', { name: 'Processing failed' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', '/preview/ensantina.mp4?color=660005&threshold=67');
  });

  it('says when the job does not exist', async () => {
    mockFetch({});
    renderAt('nope');
    expect(await screen.findByRole('heading', { name: 'Job not found' })).toBeInTheDocument();
  });
});
