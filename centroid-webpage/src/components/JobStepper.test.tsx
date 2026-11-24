import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import JobStepper from './JobStepper';

const marks = () => screen.getAllByRole('listitem').map((li) => li.querySelector('.stepper__mark')?.textContent);

describe('JobStepper', () => {
  it('shows processing as the active step', () => {
    render(<JobStepper status="processing" />);
    expect(marks()).toEqual(['✓', '2', '3']);
    expect(screen.getByText('Reading frames')).toBeInTheDocument();
  });

  it('checks off every step when done', () => {
    render(<JobStepper status="done" />);
    expect(marks()).toEqual(['✓', '✓', '✓']);
    expect(screen.getByText('CSV saved')).toBeInTheDocument();
  });

  it('marks the processing step as failed on error', () => {
    render(<JobStepper status="error" />);
    expect(marks()).toEqual(['✓', '!', '3']);
    expect(screen.getByText('Exited with an error')).toBeInTheDocument();
  });
});
