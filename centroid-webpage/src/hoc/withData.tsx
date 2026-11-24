import { useCallback, useEffect, useState, type ComponentType } from 'react';

/** Props that {@link withData} adds to the component it wraps. */
export interface WithDataProps<T> {
  /** The loaded data. Always present: the wrapped component only renders once it has loaded. */
  data: T;
  /** Loads the data again. */
  reload: () => void;
}

/** Settings for {@link withData}. All are optional. */
interface Options<T> {
  /** Keep reloading every `pollMs` while this returns true (e.g. while a job is processing). */
  pollWhile?: (data: T) => boolean;
  /** How often to reload while `pollWhile` is true, in milliseconds. Default 3000. */
  pollMs?: number;
  /** Shown while the first load is in progress. Default "Loading…". */
  loadingMessage?: string;
  /** Shown, with a Retry button, if the first load fails. */
  errorMessage?: string;
}

/**
 * Higher-order component (HOC) that handles loading data for another component.
 *
 * Takes a component that needs data plus a function that loads it, and returns a new
 * component that does the fetching. The new component shows a loading message, then an
 * error with a Retry button if loading failed, and otherwise renders the original
 * component with `data` and `reload` props added. Any other props are passed through.
 *
 * @typeParam T the type of the loaded data
 * @typeParam P the wrapped component's own props (everything except `data` and `reload`)
 * @param Wrapped the component to render once the data has loaded
 * @param load async function that loads the data; called on mount, on Retry, and when polling
 * @param options polling and message settings
 * @returns a component that takes `P` and supplies `data` and `reload` itself
 *
 * @example
 * const VideoGrid = withData(VideoGridView, () => api.getVideos());
 * <VideoGrid />  // VideoGridView receives props.data = the list of videos
 */
export function withData<T, P extends object = object>(
  Wrapped: ComponentType<P & WithDataProps<T>>,
  load: () => Promise<T>,
  options: Options<T> = {},
): ComponentType<P> {
  const {
    pollWhile,
    pollMs = 3000,
    loadingMessage = 'Loading…',
    errorMessage = "Couldn't load data from the server. Make sure the backend is running.",
  } = options;

  /** The component returned by withData. */
  function WithData(props: P) {
    const [data, setData] = useState<T | undefined>(undefined);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const reload = useCallback(() => setAttempt((n) => n + 1), []);

    useEffect(() => {
      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const run = async () => {
        try {
          const result = await load();
          if (cancelled) return;
          setData(result);
          setFailed(false);
          if (pollWhile?.(result)) timer = setTimeout(run, pollMs);
        } catch (e: unknown) {
          if (cancelled) return;
          console.error(e);
          setFailed(true);
        }
      };
      run();
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [attempt]);

    if (failed && data === undefined) {
      return (
        <div className="notice notice--error notice--row" role="alert">
          <span>{errorMessage}</span>
          <button type="button" className="btn btn--secondary" onClick={reload}>
            Retry
          </button>
        </div>
      );
    }
    if (data === undefined) {
      return (
        <p className="muted" role="status">
          {loadingMessage}
        </p>
      );
    }
    const wrappedProps = { ...props, data, reload } as P & WithDataProps<T>;
    return <Wrapped {...wrappedProps} />;
  }

  WithData.displayName = `withData(${Wrapped.displayName ?? Wrapped.name ?? 'Component'})`;
  return WithData;
}
