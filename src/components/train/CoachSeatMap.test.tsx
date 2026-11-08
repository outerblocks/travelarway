import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@/context/I18nContext';
import { CoachSeatMap } from '@/components/train/CoachSeatMap';
import type { TrainCoach, TrainSeat } from '@/types';

/**
 * The train map used to draw a numbered box per seat. These tests hold the two things the
 * rewrite has to keep: a seat is drawn as a seat, and a coach with an odd layout is drawn
 * with the layout it has rather than the four-across one the component assumed.
 */

function seat(overrides: Partial<TrainSeat> & { id: string; number: number; row: number; lane: number }): TrainSeat {
  return { wheelchair: false, taken: false, ...overrides };
}

function renderMap(coaches: TrainCoach[], selectedSeatIds: string[] = [], onToggleSeat = vi.fn()) {
  render(
    <I18nProvider>
      <CoachSeatMap
        coaches={coaches}
        coachNumber={coaches[0].number}
        onCoachChange={vi.fn()}
        selectedSeatIds={selectedSeatIds}
        onToggleSeat={onToggleSeat}
      />
    </I18nProvider>,
  );
  return onToggleSeat;
}

describe('CoachSeatMap', () => {
  it('draws each seat as a seat glyph, not a labelled box', () => {
    const coach: TrainCoach = {
      number: 2,
      className: 'Business',
      capacity: 2,
      seats: [seat({ id: '2-1', number: 1, row: 1, lane: 1 }), seat({ id: '2-2', number: 2, row: 1, lane: 2 })],
    };

    renderMap([coach]);

    const buttons = screen.getAllByRole('button', { name: /seat|kinapatikana|available/i });
    expect(buttons).toHaveLength(2);
    // The armchair is an svg with a backrest rect and a cushion path; a plain box has neither.
    for (const button of buttons) {
      const svg = button.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.querySelector('path')).not.toBeNull();
      expect(svg?.querySelectorAll('rect').length).toBeGreaterThanOrEqual(3);
    }
  });

  it('seats a two-plus-one coach on three columns with the aisle between the groups', () => {
    const coach: TrainCoach = {
      number: 1,
      className: 'Royal Class',
      capacity: 3,
      seats: [
        seat({ id: '1-1', number: 1, row: 1, lane: 1 }),
        seat({ id: '1-2', number: 2, row: 1, lane: 2 }),
        seat({ id: '1-3', number: 3, row: 1, lane: 4 }),
      ],
    };

    renderMap([coach]);
    const grid = screen.getByRole('group');
    // Five tracks across: two seats, the aisle, then the single. The old component forced
    // four equal lanes, which put the single beside the pair with no aisle at all.
    expect(grid.style.gridTemplateColumns).toBe('repeat(5, minmax(0, 1fr))');
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('marks a taken seat disabled and announces it', () => {
    const coach: TrainCoach = {
      number: 3,
      className: 'Business',
      capacity: 2,
      seats: [seat({ id: '3-1', number: 1, row: 1, lane: 1, taken: true }), seat({ id: '3-2', number: 2, row: 1, lane: 2 })],
    };

    renderMap([coach]);
    const taken = screen.getByRole('button', { name: /1/ });
    expect(taken).toBeDisabled();
  });

  it('shows a selected seat as pressed and keeps the stored key', async () => {
    const user = userEvent.setup();
    const coach: TrainCoach = {
      number: 2,
      className: 'Business',
      capacity: 2,
      seats: [seat({ id: '2-7', number: 7, row: 2, lane: 3 }), seat({ id: '2-8', number: 8, row: 2, lane: 4 })],
    };

    const onToggleSeat = renderMap([coach], ['2-7']);
    const selected = screen.getByRole('button', { name: /7/ });
    expect(selected).toHaveAttribute('aria-pressed', 'true');
    // Still clickable, so a passenger can give the seat back.
    await user.click(selected);
    expect(onToggleSeat).toHaveBeenCalledWith(expect.objectContaining({ id: '2-7', lane: 3 }));
  });

  it('renders the vestibule WCs the operator puts at each carriage end', () => {
    const coach: TrainCoach = {
      number: 2,
      className: 'Business',
      capacity: 1,
      seats: [seat({ id: '2-1', number: 1, row: 1, lane: 1 })],
    };

    renderMap([coach]);
    // Two WC fixtures across the top of every coach.
    const svgTexts = Array.from(document.querySelectorAll('[role="group"] svg text')).map((node) => node.textContent);
    expect(svgTexts.filter((value) => value === 'WC')).toHaveLength(2);
  });

  it('names the wheelchair space as a space rather than a seat', () => {
    const coach: TrainCoach = {
      number: 6,
      className: 'Business',
      capacity: 2,
      seats: [seat({ id: '6-1', number: 1, row: 1, lane: 1 }), seat({ id: '6-90', number: 90, row: 8, lane: 2, wheelchair: true })],
    };

    renderMap([coach]);
    const wheelchair = screen.getByRole('button', { name: /90/ });
    // The space glyph has no backrest rect; the armchair draws three.
    expect(wheelchair.querySelector('svg')?.querySelectorAll('rect').length).toBe(0);
    expect(wheelchair.querySelector('svg')?.querySelector('circle')).not.toBeNull();
  });
});
