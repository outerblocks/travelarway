export const CELL_TYPES = [
  'seat', 'aisle', 'empty', 'door_front', 'door_mid', 'driver', 'toilet', 'stairs', 'luggage', 'galley',
] as const;

export type CellType = (typeof CELL_TYPES)[number];

export function isCellType(value: string): value is CellType {
  return (CELL_TYPES as readonly string[]).includes(value);
}

export const FACILITY_CAPTION: Record<string, string> = {
  door_front: 'Door',
  door_mid: 'Door',
  toilet: 'Toilet',
  stairs: 'Stairs',
  luggage: 'Bags',
  galley: 'Galley',
  driver: 'Driver',
};

export const LAYOUT_PATTERNS = {
  '2+2': { rows: 11, cols: 5, aisleCol: 3, decks: 1 as const, label: '2+2 coach' },
  '2+1': { rows: 11, cols: 4, aisleCol: 2, decks: 1 as const, label: '2+1 executive' },
  '3+2': { rows: 12, cols: 6, aisleCol: 4, decks: 1 as const, label: '3+2 commuter' },
  'double-deck': { rows: 9, cols: 5, aisleCol: 3, decks: 2 as const, label: 'Double deck' },
} as const;

export type LayoutPatternId = keyof typeof LAYOUT_PATTERNS;
