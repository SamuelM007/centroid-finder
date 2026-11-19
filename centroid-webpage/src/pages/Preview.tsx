import { useCallback, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import FramePreview, { type PreviewStats } from '../components/FramePreview';
import SettingsPanel from '../components/SettingsPanel';
import { HEX_RE, MAX_THRESHOLD, normalizeHex } from '../lib/color';
import JobPanel from '../components/JobPanel';
import { dominantColors } from '../lib/palette';

// Settings that track the salamander in the sample video well
const DEFAULT_COLOR = '#660005';
const DEFAULT_THRESHOLD = 67;
const FALLBACK_PRESETS = ['#660005', '#000000', '#E11D48', '#16A34A', '#2563EB'];

// /preview/:filename — tune the color and threshold on the first frame, then process the video
const Preview = () => {
  const { filename = '' } = useParams<{ filename: string }>();
  const [searchParams] = useSearchParams();

  // "Run again" on a results page links here with that job's settings in the URL
  const urlColor = searchParams.get('color');
  const urlThreshold = Number(searchParams.get('threshold'));
  const [color, setColor] = useState(urlColor && HEX_RE.test(urlColor) ? normalizeHex(urlColor) : DEFAULT_COLOR);
  const [threshold, setThreshold] = useState(
    Number.isInteger(urlThreshold) && urlThreshold > 0 && urlThreshold <= MAX_THRESHOLD ? urlThreshold : DEFAULT_THRESHOLD,
  );
  const [stats, setStats] = useState<PreviewStats | null>(null);
  const [presets, setPresets] = useState<string[] | null>(null);

  // useCallback so FramePreview doesn't see a new function on every render
  const handleFrameLoaded = useCallback((rgba: Uint8ClampedArray) => setPresets(dominantColors(rgba)), []);

  let hint = { text: 'Loading the first frame…', kind: 'neutral' };
  if (stats) {
    if (stats.groups === 0) {
      hint = { text: 'Nothing matches. Raise the threshold or click the object in the first frame to pick its color.', kind: 'warn' };
    } else if (stats.matchingPercent > 20) {
      hint = { text: 'Loose: a lot of the frame matches. Try lowering the threshold.', kind: 'bad' };
    } else if (stats.groups > 25) {
      hint = { text: 'Noisy: many small groups match. Only the largest is tracked, so try a lower threshold.', kind: 'warn' };
    } else {
      hint = { text: 'Looks good. The orange dot marks the centroid that will be tracked.', kind: 'good' };
    }
  }

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
          <dl className="stats-list">
            <div>
              <dt>Matching pixels</dt>
              <dd className="mono">{stats ? `${stats.matchingPercent.toFixed(1)}%` : '–'}</dd>
            </div>
            <div>
              <dt>Groups found</dt>
              <dd className="mono">{stats ? stats.groups : '–'}</dd>
            </div>
            <div>
              <dt>Largest centroid</dt>
              <dd className="mono" data-testid="centroid">
                {stats ? `(${stats.largest.x}, ${stats.largest.y})` : '–'}
              </dd>
            </div>
          </dl>
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
