import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SettingsPanel from './SettingsPanel';

function setup(color = '#660005') {
  const onColorChange = vi.fn();
  const onThresholdChange = vi.fn();
  const view = render(
    <SettingsPanel
      color={color}
      threshold={67}
      presets={['#660005', '#E11D48']}
      presetsFromFrame
      onColorChange={onColorChange}
      onThresholdChange={onThresholdChange}
    />,
  );
  return { onColorChange, onThresholdChange, ...view };
}

describe('SettingsPanel', () => {
  it('reports threshold changes from the slider', () => {
    const { onThresholdChange } = setup();
    const slider = screen.getByLabelText('Threshold');
    expect(slider).toHaveValue('67');
    fireEvent.change(slider, { target: { value: '120' } });
    expect(onThresholdChange).toHaveBeenCalledWith(120);
  });

  it('only reports a typed hex color once it is complete and valid', async () => {
    const { onColorChange } = setup();
    const field = screen.getByLabelText('Target color');
    await userEvent.clear(field);
    await userEvent.type(field, 'ffa2');
    expect(onColorChange).not.toHaveBeenCalled();
    await userEvent.type(field, '00');
    expect(onColorChange).toHaveBeenCalledWith('#FFA200');
  });

  it('reports the color picker value in upper case', () => {
    const { onColorChange } = setup();
    fireEvent.change(screen.getByLabelText('Choose target color'), { target: { value: '#00ff00' } });
    expect(onColorChange).toHaveBeenCalledWith('#00FF00');
  });

  it('uses a preset swatch when clicked and marks the selected one', async () => {
    const { onColorChange } = setup();
    expect(screen.getByText('Most common colors in this frame')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use color #660005' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Use color #E11D48' }));
    expect(onColorChange).toHaveBeenCalledWith('#E11D48');
  });

  it('updates the hex field when the color changes from outside', () => {
    const { rerender, onColorChange, onThresholdChange } = setup('#660005');
    rerender(
      <SettingsPanel
        color="#123456"
        threshold={67}
        presets={[]}
        presetsFromFrame={false}
        onColorChange={onColorChange}
        onThresholdChange={onThresholdChange}
      />,
    );
    expect(screen.getByLabelText('Target color')).toHaveValue('#123456');
  });
});
