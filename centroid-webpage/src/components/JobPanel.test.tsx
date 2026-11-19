import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JobPanel from './JobPanel';
import { calledUrls, mockFetch } from '../test/fetchMock';

const JOB_ID = 'abc12345-0000-0000-0000-000000000000';

const renderPanel = () =>
  render(
    <MemoryRouter>
      <JobPanel fileName="ensantina.mp4" color="#660005" threshold={67} />
    </MemoryRouter>,
  );

afterEach(() => vi.unstubAllGlobals());

describe('JobPanel', () => {
  it('submits the job with the current settings and links to the CSV when done', async () => {
    let checks = 0;
    const fetchFn = mockFetch({
      'POST /api/process/ensantina.mp4': () => new Response(JSON.stringify({ jobId: JOB_ID }), { status: 202 }),
      [`GET /api/process/${JOB_ID}/status`]: () => {
        checks++;
        return checks === 1 ? { status: 'processing' } : { status: 'done', result: `/api/result/${JOB_ID}` };
      },
    });
    renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Process Video with These Settings' }));

    // while processing: progress bar, and the button can't be clicked again
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Process Video with These Settings' })).toBeDisabled();

    // the hook checks again after 2 seconds and gets "done"
    const link = await screen.findByRole('link', { name: 'Download CSV' }, { timeout: 4000 });
    expect(link).toHaveAttribute('href', `/api/result/${JOB_ID}`);
    expect(screen.getByRole('link', { name: 'View results' })).toHaveAttribute('href', `/jobs/${JOB_ID}`);

    const urls = calledUrls(fetchFn);
    expect(urls[0]).toBe('POST /api/process/ensantina.mp4?targetColor=660005&threshold=67');
    expect(urls).toContain(`GET /api/process/${JOB_ID}/status`);
  });

  it('shows the error when the job fails', async () => {
    mockFetch({
      'POST /api/process/ensantina.mp4': () => ({ jobId: JOB_ID }),
      [`GET /api/process/${JOB_ID}/status`]: () => ({ status: 'error', error: 'Error processing video' }),
    });
    renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Process Video with These Settings' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Processing failed: Error processing video');
    // can try again
    expect(screen.getByRole('button', { name: 'Process Video with These Settings' })).toBeEnabled();
  });

  it("shows the server's message when the job can't be started", async () => {
    mockFetch({
      'POST /api/process/ensantina.mp4': () => new Response(JSON.stringify({ error: 'Video not found: ensantina.mp4' }), { status: 404 }),
    });
    renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Process Video with These Settings' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Video not found: ensantina.mp4');
  });
});
