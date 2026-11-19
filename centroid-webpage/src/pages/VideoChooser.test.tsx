import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VideoChooser from './VideoChooser';
import { mockFetch } from '../test/fetchMock';
import { mockVideoList } from '../mock/videos';
import { mockJobs } from '../mock/jobs';

const renderPage = () =>
  render(
    <MemoryRouter>
      <VideoChooser />
    </MemoryRouter>,
  );

afterEach(() => vi.unstubAllGlobals());

describe('Video Chooser page', () => {
  it('lists the videos from GET /api/videos, each linking to its preview page', async () => {
    mockFetch({ 'GET /api/videos': () => mockVideoList, 'GET /api/jobs': () => mockJobs });
    renderPage();

    const list = await screen.findByRole('list', { name: 'Available videos' });
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(mockVideoList.length);
    expect(links[0]).toHaveAttribute('href', '/preview/ensantina.mp4');
    expect(links[0]).toHaveTextContent('ensantina.mp4');
  });

  it("shows each video's latest job status", async () => {
    mockFetch({ 'GET /api/videos': () => mockVideoList, 'GET /api/jobs': () => mockJobs });
    renderPage();

    // mockJobs is newest first: the newest ensantina.mp4 job is "done"
    const card = await screen.findByRole('link', { name: /ensantina\.mp4/ });
    expect(card).toHaveTextContent('Tracked');
    expect(screen.getByRole('link', { name: /forest_intro\.mp4/ })).toHaveTextContent('Not processed');
  });

  it('filters videos by name', async () => {
    mockFetch({ 'GET /api/videos': () => mockVideoList, 'GET /api/jobs': () => [] });
    renderPage();
    await screen.findByRole('list', { name: 'Available videos' });

    await userEvent.type(screen.getByLabelText('Filter videos'), 'forest');
    expect(screen.getAllByRole('link', { name: /\.mp4|\.mov/ })).toHaveLength(1);
    expect(screen.getByRole('link', { name: /forest_intro\.mp4/ })).toBeInTheDocument();
  });

  it('still shows the videos if the jobs request fails', async () => {
    mockFetch({ 'GET /api/videos': () => ['only.mp4'] });
    renderPage();
    expect(await screen.findByRole('link', { name: /only\.mp4/ })).toHaveTextContent('Not processed');
  });

  it('shows an error when the videos cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch({ 'GET /api/videos': () => new Response('{}', { status: 500 }) });
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load data");
  });
});
