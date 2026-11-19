import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { mockFetch } from './test/fetchMock';

afterEach(() => vi.unstubAllGlobals());

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe('routes', () => {
  it('redirects / to the Video Chooser at /videos', async () => {
    mockFetch({ 'GET /api/videos': () => ['a.mp4'], 'GET /api/jobs': () => [], 'GET /api/health': () => 'ok' });
    renderAt('/');
    expect(await screen.findByRole('heading', { name: 'Videos' })).toBeInTheDocument();
    expect(await screen.findByText('Server online')).toBeInTheDocument();
  });

  it('shows the preview page for /preview/:filename', () => {
    mockFetch({});
    renderAt('/preview/ensantina.mp4');
    expect(screen.getByRole('heading', { level: 1, name: 'ensantina.mp4' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'First frame of the video' })).toHaveAttribute('src', '/api/thumbnail/ensantina.mp4');
    expect(screen.getByRole('button', { name: 'Process Video with These Settings' })).toBeInTheDocument();
  });

  it('starts the preview with settings from the URL', () => {
    mockFetch({});
    renderAt('/preview/ensantina.mp4?color=FFA200&threshold=164');
    expect(screen.getByLabelText('Target color')).toHaveValue('#FFA200');
    expect(screen.getByLabelText('Threshold')).toHaveValue('164');
  });

  it('shows a not found page for unknown paths', () => {
    mockFetch({});
    renderAt('/nope');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
