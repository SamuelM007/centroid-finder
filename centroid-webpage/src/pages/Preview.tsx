import { useCallback, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import FramePreview from '../components/FramePreview';
import FrameStats from '../components/FrameStats';
import SettingsPanel from '../components/SettingsPanel';
import JobPanel from '../components/JobPanel';
import { dominantColors } from '../lib/palette';
import { getPreviewHint, type PreviewStats } from '../lib/previewHint';
import { settingsFromUrl } from '../lib/settings';

/** Preset swatches shown until the first frame has loaded and its common colors are known. */
const FALLBACK_PRESETS = ['#660005', '#000000', '#E11D48', '#16A34A', '#2563EB'];

/**
 * The preview page at `/preview/:filename`. Shows the video's first frame next to a live
 * binarized version, lets the user tune the target color and threshold, and starts a
 * processing job with those settings.
 *
 * This page owns the color and threshold state and passes them down to
 * `FramePreview`, `SettingsPanel` and `JobPanel`. Starting values can come from the URL
 * (`?color=FFA200&threshold=164`), which is how "Run again with new settings" works.
 */
const Preview = () => {
  const { filename = '' } = useParams<{ filename: string }>();
  const [searchParams] = useSearchParams();

  // "Run again" on a results page links here with that job's settings in the URL
  const [initial] = useState(() => settingsFromUrl(searchParams.get('color'), searchParams.get('threshold')));
  const [color, setColor] = useState(initial.color);
  const [threshold, setThreshold] = useState(initial.threshold);
  const [stats, setStats] = useState<PreviewStats | null>(null);
  const [presets, setPresets] = useState<string[] | null>(null);

  // useCallback so FramePreview doesn't see a new function on every render
  const handleFrameLoaded = useCallback((rgba: Uint8ClampedArray) => setPresets(dominantColors(rgba)), []);

  const hint = getPreviewHint(stats);

  return (
    <main className="page">
      <div className="page-head">
        <div className="page-head__text">
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <Link to="/videos">Videos</Link>
            <span aria-hidden="true">/</span>
            <span>{filename}</span>
          </nav>
          <h1>{filename}</h1>
        </div>
      </div>

      <section className="card stack" aria-labelledby="preview-heading">
        <div className="card__head">
          <h2 id="preview-heading">Preview</h2>
          <span className="muted small">Updates live as you change the settings</span>
        </div>
        <FramePreview
          thumbnailUrl={api.thumbnailUrl(filename)}
          color={color}
          threshold={threshold}
          onPickColor={setColor}
          onStats={setStats}
          onFrameLoaded={handleFrameLoaded}
        />
      </section>

      <div className="two-col">
        <section className="two-col__main card stack" aria-labelledby="settings-heading">
          <h2 id="settings-heading">Settings</h2>
          <SettingsPanel
            color={color}
            threshold={threshold}
            presets={presets ?? FALLBACK_PRESETS}
            presetsFromFrame={presets !== null}
            onColorChange={setColor}
            onThresholdChange={setThreshold}
          />
        </section>

        <aside className="two-col__side card stack" aria-labelledby="result-heading">
          <h2 id="result-heading">This frame</h2>
          <FrameStats stats={stats} />
          <p className={`hint hint--${hint.kind}`}>{hint.text}</p>
          <div className="divider-top">
            <JobPanel fileName={filename} color={color} threshold={threshold} />
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Preview;
