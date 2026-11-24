import type { JobStatus } from '../api';

/** How a step is drawn: check mark (done), orange (active), red "!" (error) or gray (idle). */
type StepState = 'done' | 'active' | 'error' | 'idle';

interface Step {
  label: string;
  /** Smaller text under the label. */
  sub: string;
  state: StepState;
}

/** The three steps a job goes through, and the state of each for a job with this status. */
function stepsFor(status: JobStatus): Step[] {
  return [
    { label: 'Started', sub: 'Job created', state: 'done' },
    {
      label: 'Processing',
      sub: status === 'error' ? 'Exited with an error' : status === 'done' ? 'All frames read' : 'Reading frames',
      state: status === 'processing' ? 'active' : status === 'error' ? 'error' : 'done',
    },
    {
      label: 'Results ready',
      sub: status === 'done' ? 'CSV saved' : 'Waiting',
      state: status === 'done' ? 'done' : 'idle',
    },
  ];
}

/** Progress steps on the results page: Started → Processing → Results ready. */
const JobStepper = ({ status }: { status: JobStatus }) => (
  <ol className="stepper card" aria-label="Job progress">
    {stepsFor(status).map((step, i) => (
      <li key={step.label} className={`stepper__step stepper__step--${step.state}`}>
        <span className="stepper__mark">{step.state === 'done' ? '✓' : step.state === 'error' ? '!' : i + 1}</span>
        <span className="stepper__text">
          <span className="strong">{step.label}</span>
          <span className="muted small">{step.sub}</span>
        </span>
      </li>
    ))}
  </ol>
);

export default JobStepper;
