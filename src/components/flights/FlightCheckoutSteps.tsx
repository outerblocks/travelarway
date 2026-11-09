import { useI18n } from '@/context/I18nContext';

type StepState = 'current' | 'open' | 'blocked';

export function FlightCheckoutSteps({ current }: { current: 'passengers' | 'review' }) {
  const { tp } = useI18n();
  const steps: { id: string; label: string; state: StepState }[] = [
    { id: 'passengers', label: tp('flightStepPassengers'), state: current === 'passengers' ? 'current' : 'open' },
    { id: 'review', label: tp('flightStepReview'), state: current === 'review' ? 'current' : current === 'passengers' ? 'open' : 'open' },
    { id: 'seats', label: tp('flightStepSeats'), state: 'blocked' },
    { id: 'bags', label: tp('flightStepExtraBags'), state: 'blocked' },
    { id: 'reservation', label: tp('flightStepReservation'), state: 'blocked' },
    { id: 'ticketing', label: tp('flightStepTicketing'), state: 'blocked' },
  ];

  return (
    <ol className="space-y-2">
      {steps.map((step, index) => (
        <li key={step.id} className="flex items-start gap-2 text-meta">
          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold ${
            step.state === 'current'
              ? 'bg-brand-600 text-white'
              : step.state === 'blocked'
                ? 'bg-neutral-200 text-neutral-500'
                : 'bg-neutral-100 text-neutral-700'
          }`}
          >
            {index + 1}
          </span>
          <span className={step.state === 'blocked' ? 'text-neutral-500' : 'text-neutral-800'}>
            {step.label}
            {step.state === 'blocked' ? ` · ${tp('flightStepNotEnabled')}` : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
