import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Jobs from './Jobs';
import { mockFetch } from '../test/fetchMock';
import { mockJobs } from '../mock/jobs';

afterEach(() => vi.unstubAllGlobals());

const renderPage = () =>
  render(
    <MemoryRouter>
      <Jobs />
    </MemoryRouter>,
  );

describe('Jobs page', () => {
  it('lists every job with a link to its results', async () => {
    mockFetch({ 'GET /api/jobs': () => mockJobs });
    renderPage();

    expect(await screen.findByRole('link', { name: 'View job 2348f737' })).toHaveAttribute('href', `/jobs/${mockJobs[0].id}`);
    expect(screen.getAllByRole('row')).toHaveLength(1 + mockJobs.length); // header + jobs
  });

  it('filters by status', async () => {
    mockFetch({ 'GET /api/jobs': () => mockJobs });
    renderPage();
    await screen.findByRole('table');

    await userEvent.click(screen.getByRole('button', { name: 'Error' }));
    expect(screen.getByRole('button', { name: 'Error' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('FFA200')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Processing' }));
    expect(screen.getByText('No jobs with this status.')).toBeInTheDocument();
  });

  it('explains what to do when there are no jobs', async () => {
    mockFetch({ 'GET /api/jobs': () => [] });
    renderPage();
    expect(await screen.findByText(/No jobs yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pick a video' })).toHaveAttribute('href', '/videos');
  });
});
