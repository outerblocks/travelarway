/**
 * TRC SGR coach layouts, generated rather than stored by hand.
 *
 * The shape of a carriage is data, and a lot of it: 22 coaches across two trainsets, each
 * with its own grid, class, aisle position, luggage and WC cells, and a numbering rule that
 * differs between the regular coaches and the irregular ones. Typing that into SQL would
 * guarantee a transcription error somewhere in 1,576 seats.
 *
 * So the rules are written down once, here, as the generator functions below, and everything
 * else — the seed, the tests, the read models — is derived from them. The generators are
 * deterministic and were verified against the operator's seat-selection screens:
 *
 *   EMU (8 cars)      39, 90, 74, 56, 90, 74, 90, 70            = 583 seats
 *   Express (14 cars) 44 | 45, 48 | 76 + 78 x 10                = 993 seats
 *
 * Grid convention, as the operator's screens present it: `row` runs top to bottom across the
 * carriage and `col` runs left to right along it. Which row is a window seat therefore depends
 * on the coach, not on the seat number — coaches 6, 7 and 8 of the EMU are mirrored, so the
 * same number is a window seat in coach 2 and an aisle seat in coach 6. Position is derived
 * from the row for that reason and never from the number.
 *
 * The 583 mapped EMU seats sit against roughly 589 quoted by TRC's own published material.
 * The six-seat difference is unexplained. It is recorded here rather than corrected, because
 * inventing six seats to reach a rounder number would put seats on a map that the operator
 * has not shown.
 */

export type SgrClassCode = 'ROYAL' | 'BUSINESS' | 'ECONOMY';

export type SgrLayoutKind =
  | 'TWO_PLUS_ONE'
  | 'TWO_PLUS_TWO'
  | 'TWO_PLUS_TWO_FLIPPED'
  | 'TWO_PLUS_TWO_IRREGULAR'
  | 'THREE_PLUS_TWO';

export type SgrSeatPosition = 'WINDOW' | 'MIDDLE' | 'AISLE' | 'SINGLE';

export type SgrCellType = 'SEAT' | 'LUGGAGE' | 'WC' | 'TABLE' | 'AISLE' | 'DOOR';

export interface SgrSeat {
  seatNumber: number;
  row: number;
  col: number;
  seatLabel: string;
  position: SgrSeatPosition;
  /** Only ever ACCESSIBLE when the operator has confirmed it; a screen marker is not enough. */
  seatKind?: 'STANDARD' | 'ACCESSIBLE';
  /**
   * Only set where the operator has explained it. Seats drawn with a blue outline are
   * recorded as `attributes.uiMarker` and left STANDARD, because treating an unconfirmed
   * observation as an accessible seat would block a sale the operator intends to make.
   */
  attributes?: Record<string, string>;
}

export interface SgrFixture {
  cellType: Exclude<SgrCellType, 'SEAT'>;
  row: number;
  col: number;
}

export interface SgrCoachLayout {
  coachNo: number;
  classCode: SgrClassCode;
  layoutKind: SgrLayoutKind;
  gridRows: number;
  gridCols: number;
  aisleAfterRow: number;
  seats: SgrSeat[];
  fixtures: SgrFixture[];
  seatCount: number;
}

export interface SgrTrainsetLayouts {
  code: string;
  name: string;
  coaches: SgrCoachLayout[];
  totalSeats: number;
}

/** Seats along one grid row: `first`, then every `step`-th, `n` of them, from `colStart`. */
function line(row: number, first: number, n: number, colStart: number, step = 4): SgrSeat[] {
  const seats: SgrSeat[] = [];
  for (let index = 0; index < n; index += 1) {
    seats.push({
      seatNumber: first + step * index,
      row,
      col: colStart + index,
      seatLabel: '',
      position: 'AISLE',
    });
  }
  return seats;
}

/**
 * Derives position from the screen row and fills in labels. Called by every builder so a
 * coach cannot be returned with a position that was guessed from its seat number.
 */
function finishCoach(coach: Omit<SgrCoachLayout, 'seatCount'>, positionFor: (row: number) => SgrSeatPosition): SgrCoachLayout {
  const seats = coach.seats.map((seat) => ({ ...seat, position: positionFor(seat.row), seatLabel: String(seat.seatNumber) }));
  return { ...coach, seats, seatCount: seats.length };
}

// ─── EMU: 8 coaches, 2+1 Royal and 2+2 Business ────────────────────────────────

/** Coach 1: 13 columns of (single, aisle, window) = 39 Royal seats. */
function emuRoyalCoach(): SgrCoachLayout {
  const seats: SgrSeat[] = [];
  for (let column = 0; column < 13; column += 1) {
    seats.push({ seatNumber: 1 + 3 * column, row: 0, col: column, seatLabel: '', position: 'SINGLE' });
    seats.push({ seatNumber: 2 + 3 * column, row: 2, col: column, seatLabel: '', position: 'AISLE' });
    seats.push({ seatNumber: 3 + 3 * column, row: 3, col: column, seatLabel: '', position: 'WINDOW' });
  }
  return finishCoach(
    {
      coachNo: 1,
      classCode: 'ROYAL',
      layoutKind: 'TWO_PLUS_ONE',
      gridRows: 4,
      gridCols: 13,
      aisleAfterRow: 1,
      seats,
      fixtures: [],
    },
    (row) => (row === 0 ? 'SINGLE' : row === 2 ? 'AISLE' : 'WINDOW'),
  );
}

/** Coaches 2, 3 and 5: upper pair numbered first, luggage cells in the last column. */
function emuStandardCoach(coachNo: number, cols: number): SgrCoachLayout {
  const seats = [
    ...line(0, 1, cols, 0),
    ...line(1, 2, cols, 0),
    ...line(2, 3, cols - 1, 0),
    ...line(3, 4, cols - 1, 0),
  ];
  return finishCoach(
    {
      coachNo,
      classCode: 'BUSINESS',
      layoutKind: 'TWO_PLUS_TWO',
      gridRows: 4,
      gridCols: cols,
      aisleAfterRow: 1,
      seats,
      fixtures: [
        { cellType: 'LUGGAGE', row: 2, col: cols - 1 },
        { cellType: 'LUGGAGE', row: 3, col: cols - 1 },
      ],
    },
    (row) => (row === 0 || row === 3 ? 'WINDOW' : 'AISLE'),
  );
}

/** Coach 4: 13 regular columns plus an irregular tail of four seats, and no luggage cells. */
function emuIrregularCoach(): SgrCoachLayout {
  const seats = [
    ...line(0, 1, 13, 0),
    ...line(1, 2, 13, 0),
    ...line(2, 3, 13, 0),
    ...line(3, 4, 13, 0),
    { seatNumber: 55, row: 0, col: 13, seatLabel: '', position: 'WINDOW' as SgrSeatPosition },
    { seatNumber: 53, row: 2, col: 13, seatLabel: '', position: 'AISLE' as SgrSeatPosition },
    { seatNumber: 54, row: 3, col: 13, seatLabel: '', position: 'WINDOW' as SgrSeatPosition },
    { seatNumber: 56, row: 3, col: 14, seatLabel: '', position: 'WINDOW' as SgrSeatPosition },
  ];
  return finishCoach(
    {
      coachNo: 4,
      classCode: 'BUSINESS',
      layoutKind: 'TWO_PLUS_TWO_IRREGULAR',
      gridRows: 4,
      gridCols: 15,
      aisleAfterRow: 1,
      seats,
      fixtures: [],
    },
    (row) => (row === 0 || row === 3 ? 'WINDOW' : 'AISLE'),
  );
}

/** Coaches 6, 7 and 8: mirrored, so the lower pair takes the first numbers and luggage sits at the front. */
function emuFlippedCoach(coachNo: number, cols: number, upperCols: number): SgrCoachLayout {
  const seats = [
    ...line(0, 3, upperCols, 1),
    ...line(1, 4, upperCols, 1),
    ...line(2, 1, cols, 0),
    ...line(3, 2, cols, 0),
  ];
  return finishCoach(
    {
      coachNo,
      classCode: 'BUSINESS',
      layoutKind: 'TWO_PLUS_TWO_FLIPPED',
      gridRows: 4,
      gridCols: cols,
      aisleAfterRow: 1,
      seats,
      fixtures: [
        { cellType: 'LUGGAGE', row: 0, col: 0 },
        { cellType: 'LUGGAGE', row: 1, col: 0 },
      ],
    },
    (row) => (row === 0 || row === 3 ? 'WINDOW' : 'AISLE'),
  );
}

export const EMU_EXPECTED_SEAT_COUNTS: Record<number, number> = {
  1: 39, 2: 90, 3: 74, 4: 56, 5: 90, 6: 74, 7: 90, 8: 70,
};

export function buildEmuLayouts(): SgrCoachLayout[] {
  return [
    emuRoyalCoach(),
    emuStandardCoach(2, 23),
    emuStandardCoach(3, 19),
    emuIrregularCoach(),
    emuStandardCoach(5, 23),
    emuFlippedCoach(6, 19, 18),
    emuFlippedCoach(7, 23, 22),
    emuFlippedCoach(8, 18, 17),
  ];
}

// ─── Express: 14 coaches, 3+2 Economy and 2+2 Royal/Business ───────────────────

/** An Express economy seat: seat columns are 0..15 and sit one grid column in. */
function expressSeat(n: number, row: number, seatColumn: number): SgrSeat {
  return { seatNumber: n, row, col: seatColumn + 1, seatLabel: '', position: 'AISLE' };
}

/**
 * Coaches 4..14, 3+2. End fixtures in column 0 and WC along column 17 are cells, not seats:
 * they occupy the grid so the map cannot offer them, and they carry no seat number.
 */
function expressEconomyCoach(coachNo: number): SgrCoachLayout {
  const seats: SgrSeat[] = [
    // The first seat column has no aisle-side seat in the upper trio.
    expressSeat(1, 0, 0), expressSeat(2, 1, 0), expressSeat(3, 3, 0), expressSeat(4, 4, 0),
  ];
  for (let seatColumn = 1; seatColumn <= 13; seatColumn += 1) {
    for (let row = 0; row < 5; row += 1) {
      seats.push(expressSeat(5 * seatColumn + row, row, seatColumn));
    }
  }

  if (coachNo === 4) {
    // Irregular tail: the lower rows stop early and the last four seats are scattered.
    seats.push(expressSeat(70, 0, 14), expressSeat(71, 1, 14), expressSeat(72, 2, 14));
    seats.push(expressSeat(73, 0, 15), expressSeat(74, 1, 15));
    seats.push({ ...expressSeat(75, 4, 14), attributes: { uiMarker: 'BLUE_OUTLINE' } });
    seats.push({ ...expressSeat(76, 4, 15), attributes: { uiMarker: 'BLUE_OUTLINE' } });
  } else {
    for (let row = 0; row < 5; row += 1) seats.push(expressSeat(70 + row, row, 14));
    seats.push(expressSeat(75, 0, 15), expressSeat(76, 1, 15), expressSeat(77, 3, 15), expressSeat(78, 4, 15));
  }

  const fixtures: SgrFixture[] = [
    { cellType: 'WC', row: 0, col: 0 },
    { cellType: 'WC', row: 1, col: 0 },
    { cellType: 'WC', row: 2, col: 0 },
    { cellType: 'LUGGAGE', row: 3, col: 0 },
    { cellType: 'LUGGAGE', row: 4, col: 0 },
    ...[0, 1, 2, 3, 4].map((row): SgrFixture => ({ cellType: 'WC', row, col: 17 })),
  ];

  return finishCoach(
    {
      coachNo,
      classCode: 'ECONOMY',
      layoutKind: 'THREE_PLUS_TWO',
      gridRows: 5,
      gridCols: 18,
      aisleAfterRow: 2,
      seats,
      fixtures,
    },
    // Rows 0 and 4 are the outer sides, row 1 is the middle of the trio, rows 2 and 3 flank the aisle.
    (row) => (row === 0 || row === 4 ? 'WINDOW' : row === 1 ? 'MIDDLE' : 'AISLE'),
  );
}

export const EXPRESS_ECONOMY_EXPECTED: Record<number, number> = {
  4: 76, 5: 78, 6: 78, 7: 78, 8: 78, 9: 78, 10: 78, 11: 78, 12: 78, 13: 78, 14: 78,
};

export function buildExpressEconomyLayouts(): SgrCoachLayout[] {
  return Object.keys(EXPRESS_ECONOMY_EXPECTED).map((key) => expressEconomyCoach(Number(key)));
}

/** Express coaches 1..3, all 2+2. Seat columns are offset by whatever fixtures own column 0. */
function expressPremiumSeat(n: number, row: number, seatColumn: number, colOffset: number, extra?: Partial<SgrSeat>): SgrSeat {
  return { seatNumber: n, row, col: seatColumn + colOffset, seatLabel: '', position: 'AISLE', ...extra };
}

/** Coach 1: 11 columns x 4 = 44 Royal seats, WC at the far end, no luggage cells. */
function expressRoyalCoach(): SgrCoachLayout {
  const seats: SgrSeat[] = [];
  for (let seatColumn = 0; seatColumn <= 10; seatColumn += 1) {
    for (let row = 0; row < 4; row += 1) {
      seats.push(expressPremiumSeat(4 * seatColumn + 1 + row, row, seatColumn, 0));
    }
  }
  return finishCoach(
    {
      coachNo: 1,
      classCode: 'ROYAL',
      layoutKind: 'TWO_PLUS_TWO',
      gridRows: 4,
      gridCols: 12,
      aisleAfterRow: 1,
      seats,
      fixtures: [0, 1, 2, 3].map((row): SgrFixture => ({ cellType: 'WC', row, col: 11 })),
    },
    (row) => (row === 0 || row === 3 ? 'WINDOW' : 'AISLE'),
  );
}

/** Coach 2: 45 Business seats. The last five break the four-per-column rhythm. */
function expressBusinessCoach2(): SgrCoachLayout {
  const seats: SgrSeat[] = [];
  for (let seatColumn = 0; seatColumn <= 9; seatColumn += 1) {
    for (let row = 0; row < 4; row += 1) {
      seats.push(expressPremiumSeat(4 * seatColumn + 1 + row, row, seatColumn, 1));
    }
  }
  seats.push(
    expressPremiumSeat(41, 2, 10, 1), expressPremiumSeat(42, 3, 10, 1),
    expressPremiumSeat(43, 2, 11, 1), expressPremiumSeat(44, 3, 11, 1),
    expressPremiumSeat(45, 0, 11, 1, { attributes: { uiMarker: 'BLUE_OUTLINE' } }),
  );
  return finishCoach(
    {
      coachNo: 2,
      classCode: 'BUSINESS',
      layoutKind: 'TWO_PLUS_TWO_IRREGULAR',
      gridRows: 4,
      gridCols: 14,
      aisleAfterRow: 1,
      seats,
      fixtures: [
        { cellType: 'LUGGAGE', row: 2, col: 0 },
        { cellType: 'LUGGAGE', row: 3, col: 0 },
        { cellType: 'WC', row: 2, col: 13 },
        { cellType: 'WC', row: 3, col: 13 },
      ],
    },
    (row) => (row === 0 || row === 3 ? 'WINDOW' : 'AISLE'),
  );
}

/** Coach 3: 12 columns x 4 = 48 Business seats, fixtures on both ends. */
function expressBusinessCoach3(): SgrCoachLayout {
  const seats: SgrSeat[] = [];
  for (let seatColumn = 0; seatColumn <= 11; seatColumn += 1) {
    for (let row = 0; row < 4; row += 1) {
      seats.push(expressPremiumSeat(4 * seatColumn + 1 + row, row, seatColumn, 1));
    }
  }
  return finishCoach(
    {
      coachNo: 3,
      classCode: 'BUSINESS',
      layoutKind: 'TWO_PLUS_TWO',
      gridRows: 4,
      gridCols: 14,
      aisleAfterRow: 1,
      seats,
      fixtures: [
        { cellType: 'WC', row: 0, col: 0 },
        { cellType: 'WC', row: 1, col: 0 },
        { cellType: 'LUGGAGE', row: 2, col: 0 },
        { cellType: 'LUGGAGE', row: 3, col: 0 },
        ...[0, 1, 2, 3].map((row): SgrFixture => ({ cellType: 'WC', row, col: 13 })),
      ],
    },
    (row) => (row === 0 || row === 3 ? 'WINDOW' : 'AISLE'),
  );
}

export const EXPRESS_PREMIUM_EXPECTED: Record<number, number> = { 1: 44, 2: 45, 3: 48 };

export function buildExpressPremiumLayouts(): SgrCoachLayout[] {
  return [expressRoyalCoach(), expressBusinessCoach2(), expressBusinessCoach3()];
}

// ─── Trainsets and invariants ───────────────────────────────────────────────────

/**
 * Checks one coach against the operator's published figures: the expected seat count,
 * contiguous numbering from 1, and no two things claiming the same grid cell.
 */
function assertCoach(coach: SgrCoachLayout, expected: number): void {
  const numbers = coach.seats.map((seat) => seat.seatNumber).sort((left, right) => left - right);
  if (numbers.length !== expected) {
    throw new Error(`coach ${coach.coachNo}: ${numbers.length} seats, expected ${expected}`);
  }
  numbers.forEach((number, index) => {
    if (number !== index + 1) throw new Error(`coach ${coach.coachNo}: numbering gap at ${index + 1}`);
  });

  const cells = new Set([...coach.seats, ...coach.fixtures].map((cell) => `${cell.row},${cell.col}`));
  if (cells.size !== coach.seats.length + coach.fixtures.length) {
    throw new Error(`coach ${coach.coachNo}: overlapping cells`);
  }

  for (const seat of coach.seats) {
    if (seat.row < 0 || seat.row >= coach.gridRows) throw new Error(`coach ${coach.coachNo}: seat ${seat.seatNumber} row outside grid`);
    if (seat.col < 0 || seat.col >= coach.gridCols) throw new Error(`coach ${coach.coachNo}: seat ${seat.seatNumber} col outside grid`);
    if (seat.seatLabel !== String(seat.seatNumber)) throw new Error(`coach ${coach.coachNo}: seat ${seat.seatNumber} label not derived from its number`);
  }
}

export function assertLayouts(coaches: SgrCoachLayout[], expectedCounts: Record<number, number>, total: number): void {
  let sum = 0;
  for (const coach of coaches) {
    assertCoach(coach, expectedCounts[coach.coachNo]);
    sum += coach.seatCount;
  }
  if (sum !== total) throw new Error(`expected ${total} seats in total, generated ${sum}`);
}

export const EMU_TOTAL_SEATS = 583;
export const EXPRESS_ECONOMY_TOTAL_SEATS = 856;
/** Premium (Royal + Business, coaches 1–3) plus Economy. A check value, not the source. */
export const EXPRESS_TOTAL_SEATS = 993;

export function buildEmuTrainset(): SgrTrainsetLayouts {
  const coaches = buildEmuLayouts();
  assertLayouts(coaches, EMU_EXPECTED_SEAT_COUNTS, EMU_TOTAL_SEATS);
  return { code: 'TRC_SGR_EMU_8CAR', name: 'SGR EMU (8 coaches)', coaches, totalSeats: EMU_TOTAL_SEATS };
}

export function buildExpressTrainset(): SgrTrainsetLayouts {
  const coaches = [...buildExpressPremiumLayouts(), ...buildExpressEconomyLayouts()];
  for (const coach of coaches) {
    const expected = EXPRESS_PREMIUM_EXPECTED[coach.coachNo] ?? EXPRESS_ECONOMY_EXPECTED[coach.coachNo];
    assertCoach(coach, expected);
  }
  // Computed from the coaches rather than typed in, so a layout change cannot leave a stale
  // capacity behind; EXPRESS_TOTAL_SEATS only verifies the result.
  const totalSeats = coaches.reduce((sum, coach) => sum + coach.seatCount, 0);
  if (totalSeats !== EXPRESS_TOTAL_SEATS) {
    throw new Error(`expected ${EXPRESS_TOTAL_SEATS} seats in total, generated ${totalSeats}`);
  }
  return { code: 'TRC_SGR_EXPRESS', name: 'SGR Express (14 coaches)', coaches, totalSeats };
}

export function buildAllTrainsets(): SgrTrainsetLayouts[] {
  return [buildEmuTrainset(), buildExpressTrainset()];
}
