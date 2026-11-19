import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { withData, type WithDataProps } from './withData';

function Names({ data, greeting }: WithDataProps<string[]> & { greeting: string }) {
  return (
    <ul>
      {data.map((n) => (
        <li key={n}>
          {greeting} {n}
        </li>
      ))}
    </ul>
  );
}

afterEach(() => vi.restoreAllMocks());

describe('withData', () => {
  it('shows a loading message, then the wrapped component with the data', async () => {
    const Wrapped = withData<string[], { greeting: string }>(Names, async () => ['Ada', 'Lin'], { loadingMessage: 'Loading names…' });
    render(<Wrapped greeting="Hi" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading names…');
    expect(await screen.findByText('Hi Ada')).toBeInTheDocument();
    expect(screen.getByText('Hi Lin')).toBeInTheDocument();
  });

  it('shows an error with a Retry button that loads again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = vi.fn<() => Promise<string[]>>().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(['Ada']);
    const Wrapped = withData<string[], { greeting: string }>(Names, load, { errorMessage: 'Server is down' });
    render(<Wrapped greeting="Hi" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Server is down');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Hi Ada')).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('keeps reloading while pollWhile returns true', async () => {
    const load = vi
      .fn<() => Promise<string[]>>()
      .mockResolvedValueOnce(['processing'])
      .mockResolvedValueOnce(['done']);
    const Wrapped = withData<string[], { greeting: string }>(Names, load, {
      pollWhile: (d) => d[0] === 'processing',
      pollMs: 10,
    });
    render(<Wrapped greeting="Job" />);

    expect(await screen.findByText('Job done')).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('names the wrapper after the wrapped component', () => {
    expect(withData(Names, async () => []).displayName).toBe('withData(Names)');
  });
});
