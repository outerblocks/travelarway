/**
 * Shared timetable block for search results.
 * Times sit in a three-column grid. Duration and connections are type, not a diagram.
 */
export function ScheduleStrip({
  startTime,
  startPlace,
  endTime,
  endPlace,
  duration,
  connection,
  nextDay,
}: {
  startTime: string;
  startPlace: string;
  endTime: string;
  endPlace: string;
  duration?: string | null;
  connection?: string | null;
  nextDay?: boolean;
}) {
  return (
    <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-5">
      <div>
        <p className="text-[1.75rem] font-semibold leading-none tabular-nums tracking-tight text-neutral-900">{startTime}</p>
        <p className="mt-1 text-meta text-neutral-600">{startPlace}</p>
      </div>
      <div className="flex min-w-0 flex-col items-center pt-2 text-center text-meta text-neutral-500">
        <div className="flex w-full items-center" aria-hidden="true">
          <span className="schedule-rule" />
        </div>
        {duration ? <p className="mt-1.5 tabular-nums text-neutral-700">{duration}</p> : null}
        {connection ? <p className="mt-0.5">{connection}</p> : null}
      </div>
      <div className="text-right">
        <p className="text-[1.75rem] font-semibold leading-none tabular-nums tracking-tight text-neutral-900">
          {endTime}
          {nextDay ? <sup className="ml-0.5 text-[10px] font-semibold text-neutral-500">+1</sup> : null}
        </p>
        <p className="mt-1 text-meta text-neutral-600">{endPlace}</p>
      </div>
    </div>
  );
}
