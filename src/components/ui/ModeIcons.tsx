import { Bus, Ship, Plane, TrainFront, BedDouble, Compass, type LucideIcon } from 'lucide-react';
import type { BookingMode } from '@/types';

export const MODE_ICON_MAP: Record<BookingMode, LucideIcon> = {
  bus: Bus,
  ferry: Ship,
  flights: Plane,
  train: TrainFront,
  stays: BedDouble,
  experiences: Compass,
};
