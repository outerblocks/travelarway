import { AirlineLogo } from '@/components/flights/AirlineLogo';
import { useI18n } from '@/context/I18nContext';
import type { PublicAirLeg, PublicAirOffer } from '@/domain/air-offer';
import {
  airportLine,
  displayAirline,
  isNightDeparture,
  layoverMinutes,
  segmentArrivesNextDay,
} from '@/domain/flight-results';
import { formatDurationLong, formatScheduleHeading, isoDurationMinutes } from '@/utils/format';

export function FlightItineraryList({
  offer,
  legs,
}: {
  offer: PublicAirOffer;
  legs: PublicAirLeg[];
}) {
  const { tp } = useI18n();
  const cabin = offer.cabinClass;

  return (
    <ol>
      {legs.map((leg, index) => {
        const next = legs[index + 1];
        const flown = leg.duration ? isoDurationMinutes(leg.duration) : null;
        const overnight = segmentArrivesNextDay(leg.departure, leg.arrival);
        const layover = next ? layoverMinutes(leg.arrival, next.departure) : null;
        const equipment = leg.equipmentName || leg.equipment;
        const operated = leg.operatingCarrierName
          && leg.operatingCarrier
          && leg.operatingCarrier !== leg.carrier
          ? `${tp('operatedByCarrier')} ${leg.operatingCarrierName}`
          : null;
        const notes = [
          equipment ? `${tp('equipmentLabel')} ${equipment}` : null,
          flown != null && flown > 0 ? `${tp('travelTime')} ${formatDurationLong(flown)}` : null,
          isNightDeparture(leg.departure) ? tp('nightFlight') : null,
          cabin ? `${tp('cabinLabel')} ${cabin}` : null,
          overnight ? tp('arrivesNextDayFlight') : null,
          operated,
        ].filter(Boolean);
        const airline = displayAirline(leg);

        return (
          <li key={`${leg.carrier}-${leg.flightNumber}-${leg.departure}`} className="border-t border-neutral-100 py-3 first:border-t-0">
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 text-body text-neutral-800">
              <p className="tabular-nums text-neutral-900">{formatScheduleHeading(leg.departure)}</p>
              <div>
                <p>
                  <span className="font-semibold text-neutral-900">{leg.origin}</span>
                  {' '}
                  {airportLine(leg.origin, leg.originName, leg.originCountry)}
                  {leg.originTerminal ? ` · ${tp('terminalLabel').replace('{terminal}', leg.originTerminal)}` : ''}
                </p>
                <div className="mt-2 flex items-start gap-2">
                  <AirlineLogo code={airline.code} fallbackCode={leg.carrier} name={airline.name} size="sm" />
                  <div>
                    <p className="font-medium text-neutral-900">{airline.name || airline.code} {leg.carrier} {leg.flightNumber}</p>
                    {notes.length > 0 && <p className="text-meta text-neutral-600">{notes.join(' · ')}</p>}
                  </div>
                </div>
              </div>
              <p className="tabular-nums text-neutral-900">{formatScheduleHeading(leg.arrival)}</p>
              <p>
                <span className="font-semibold text-neutral-900">{leg.destination}</span>
                {' '}
                {airportLine(leg.destination, leg.destinationName, leg.destinationCountry)}
                {leg.destinationTerminal ? ` · ${tp('terminalLabel').replace('{terminal}', leg.destinationTerminal)}` : ''}
              </p>
            </div>
            {layover != null && layover >= 0 && next && (
              <p className="mt-3 pl-[5.5rem] text-meta text-neutral-600">
                {tp('layover').replace('{duration}', formatDurationLong(layover))}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
