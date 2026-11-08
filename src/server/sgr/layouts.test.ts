import { describe, expect, it } from 'vitest';
import {
  EMU_EXPECTED_SEAT_COUNTS,
  EMU_TOTAL_SEATS,
  EXPRESS_ECONOMY_EXPECTED,
  EXPRESS_PREMIUM_EXPECTED,
  assertLayouts,
  buildEmuLayouts,
  buildExpressEconomyLayouts,
  buildExpressPremiumLayouts,
} from '@/server/sgr/layouts';

/**
 * The invariants the operator's screens establish. These run before the seed is generated,
 * so a coach that no longer adds up stops the seed rather than reaching a database and being
 * sold against.
 */
describe('SGR coach layouts', () => {
  it('EMU: per-coach counts and total match the operator (583 seats)', () => {
    const coaches = buildEmuLayouts();
    expect(coaches.map((coach) => coach.seatCount)).toEqual([39, 90, 74, 56, 90, 74, 90, 70]);
    expect(coaches.reduce((sum, coach) => sum + coach.seatCount, 0)).toBe(EMU_TOTAL_SEATS);
    expect(() => assertLayouts(coaches, EMU_EXPECTED_SEAT_COUNTS, EMU_TOTAL_SEATS)).not.toThrow();
  });

  it('Express: premium and economy coaches add up to 993', () => {
    const premium = buildExpressPremiumLayouts();
    const economy = buildExpressEconomyLayouts();

    expect(premium.map((coach) => coach.seatCount)).toEqual([44, 45, 48]);
    expect(economy.map((coach) => coach.seatCount)).toEqual([76, ...Array.from({ length: 10 }, () => 78)]);

    assertLayouts(premium, EXPRESS_PREMIUM_EXPECTED, 137);
    assertLayouts(economy, EXPRESS_ECONOMY_EXPECTED, 856);
  });

  it('numbering is contiguous from 1 within every coach', () => {
    for (const coach of [...buildEmuLayouts(), ...buildExpressPremiumLayouts(), ...buildExpressEconomyLayouts()]) {
      const numbers = coach.seats.map((seat) => seat.seatNumber).sort((left, right) => left - right);
      expect(numbers[0], `coach ${coach.coachNo}`).toBe(1);
      expect(numbers[numbers.length - 1], `coach ${coach.coachNo}`).toBe(coach.seatCount);
      expect(new Set(numbers).size, `coach ${coach.coachNo}`).toBe(coach.seatCount);
    }
  });

  it('no two things occupy the same grid cell, and every seat sits inside the grid', () => {
    for (const coach of [...buildEmuLayouts(), ...buildExpressPremiumLayouts(), ...buildExpressEconomyLayouts()]) {
      const cells = new Set([...coach.seats, ...coach.fixtures].map((cell) => `${cell.row},${cell.col}`));
      expect(cells.size, `coach ${coach.coachNo}`).toBe(coach.seats.length + coach.fixtures.length);

      for (const seat of coach.seats) {
        expect(seat.row).toBeGreaterThanOrEqual(0);
        expect(seat.row).toBeLessThan(coach.gridRows);
        expect(seat.col).toBeGreaterThanOrEqual(0);
        expect(seat.col).toBeLessThan(coach.gridCols);
      }
    }
  });

  /**
   * Coaches 6, 7 and 8 of the EMU are mirrored, so a seat number says nothing about where it
   * is. If position were ever derived from the number, half of a mirrored coach would be
   * labelled wrongly on the map and a passenger would be told they have a window they do not.
   */
  it('position comes from the row, so a mirrored coach labels the same number differently', () => {
    const standard = buildEmuLayouts().find((coach) => coach.coachNo === 2);
    const mirrored = buildEmuLayouts().find((coach) => coach.coachNo === 6);

    const seatOne = standard?.seats.find((seat) => seat.seatNumber === 1);
    const mirroredSeatOne = mirrored?.seats.find((seat) => seat.seatNumber === 1);

    expect(seatOne?.position).toBe('WINDOW');
    expect(mirroredSeatOne?.position).toBe('AISLE');
  });

  it('fixtures occupy grid cells but are never seats', () => {
    const economy = buildExpressEconomyLayouts().find((coach) => coach.coachNo === 5);
    expect(economy?.fixtures.length).toBe(10);
    expect(economy?.fixtures.some((cell) => cell.cellType === 'WC')).toBe(true);
    expect(economy?.seats.some((seat) => seat.col === 0)).toBe(false);
    expect(economy?.seats.some((seat) => seat.col === 17)).toBe(false);
  });

  it('aisle position is stated per coach, because it is not always after row 1', () => {
    const emuRoyal = buildEmuLayouts().find((coach) => coach.coachNo === 1);
    const economy = buildExpressEconomyLayouts()[0];

    expect(emuRoyal?.gridRows).toBe(4);
    expect(emuRoyal?.aisleAfterRow).toBe(1);
    expect(economy.gridRows).toBe(5);
    expect(economy.aisleAfterRow).toBe(2);
  });

  /**
   * The blue-outlined seats are recorded as an observation, not as accessible seating: the
   * operator has not confirmed what the outline means, and treating it as accessible would
   * withhold seats nobody decided to withhold.
   */
  it('unexplained screen markers stay attributes on standard seats', () => {
    const coach4 = buildEmuLayouts().find((coach) => coach.coachNo === 4);
    expect(coach4?.seats.filter((seat) => seat.attributes?.uiMarker === 'BLUE_OUTLINE')).toEqual([]);

    const expressEconomy4 = buildExpressEconomyLayouts().find((coach) => coach.coachNo === 4);
    const marked = expressEconomy4?.seats.filter((seat) => seat.attributes?.uiMarker === 'BLUE_OUTLINE');
    expect(marked?.map((seat) => seat.seatNumber)).toEqual([75, 76]);
    expect(marked?.every((seat) => seat.row === 4)).toBe(true);

    const expressCoach2 = buildExpressPremiumLayouts().find((coach) => coach.coachNo === 2);
    const marked2 = expressCoach2?.seats.find((seat) => seat.seatNumber === 45);
    expect(marked2?.attributes?.uiMarker).toBe('BLUE_OUTLINE');
    expect(marked2?.row).toBe(0);
    expect(marked2?.col).toBe(12);
  });

  it('a coach that does not add up is refused rather than seeded', () => {
    const broken = buildEmuLayouts().map((coach) => ({ ...coach }));
    broken[1].seats.pop();
    expect(() => assertLayouts(broken, EMU_EXPECTED_SEAT_COUNTS, EMU_TOTAL_SEATS)).toThrow(/coach 2/);
  });
});
