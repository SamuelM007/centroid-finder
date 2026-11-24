import type { JobStatus } from '../api';

type StepState = 'done' | 'active' | 'error' | 'idle';

interface Step {
  label: string;
  sub: string;
  state: StepState;
}

// The three steps a job goes through, and where this job is
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

// Started → Processing → Results ready, with a check mark on each finished step
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
