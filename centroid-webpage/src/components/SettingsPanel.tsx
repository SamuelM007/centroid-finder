import { useState } from 'react';
import { HEX_RE, MAX_THRESHOLD, normalizeHex } from '../lib/color';

interface Props {
  color: string; // "#RRGGBB"
  threshold: number;
  presets: string[];
  presetsFromFrame: boolean;
  onColorChange: (hex: string) => void;
  onThresholdChange: (value: number) => void;
}

// Target color (picker, hex field, preset swatches) and the threshold slider
const SettingsPanel = ({ color, threshold, presets, presetsFromFrame, onColorChange, onThresholdChange }: Props) => {
  // The hex field can hold a half-typed value; it only changes the color once it's valid.
  // When the color changes from somewhere else (picker, swatch, clicking the frame),
  // reset the field to match. Adjusting state during render like this is the pattern
  // React recommends instead of an effect.
  const [draft, setDraft] = useState(color);
  const [lastColor, setLastColor] = useState(color);
  if (color !== lastColor) {
    setLastColor(color);
    setDraft(color);
  }

  return (
    <div className="stack stack--lg">
      <div className="stack stack--sm">
        <label htmlFor="hex" className="label">
          Target color
        </label>
        <div className="color-row">
          <input
            type="color"
            className="color-swatch"
            aria-label="Choose target color"
            value={color.toLowerCase()}
            onChange={(e) => onColorChange(normalizeHex(e.target.value))}
          />
          <input
            id="hex"
            type="text"
            className="input mono"
            value={draft}
            maxLength={7}
            spellCheck={false}
            onChange={(e) => {
              setDraft(e.target.value);
              if (HEX_RE.test(e.target.value)) onColorChange(normalizeHex(e.target.value));
            }}
            onBlur={() => setDraft(color)}
          />
        </div>
        <div className="stack stack--xs">
          <span className="muted small">{presetsFromFrame ? 'Most common colors in this frame' : 'Presets'}</span>
          <div className="swatches">
            {presets.map((hex) => (
              <button
                key={hex}
                type="button"
                className={`swatch${hex === color ? ' swatch--selected' : ''}`}
                style={{ background: hex }}
                aria-label={`Use color ${hex}`}
                aria-pressed={hex === color}
                title={hex}
                onClick={() => onColorChange(hex)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="stack stack--sm">
        <div className="row-between">
          <label htmlFor="threshold" className="label">
            Threshold
          </label>
          <span className="mono" aria-hidden="true">
            {threshold}
          </span>
        </div>
        <input
          id="threshold"
          type="range"
          className="range"
          min={0}
          max={MAX_THRESHOLD}
          step={1}
          value={threshold}
          onChange={(e) => onThresholdChange(Number(e.target.value))}
        />
        <div className="row-between muted xsmall">
          <span>Exact match</span>
          <span>Any color</span>
        </div>
        <p className="muted small">Max color distance from the target (0–441). Lower is stricter.</p>
      </div>
    </div>
  );
};

export default SettingsPanel;
