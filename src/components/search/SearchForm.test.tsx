import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { AppProvider } from '@/context/AppContext';
import { I18nProvider } from '@/context/I18nContext';
import { SearchForm } from '@/components/search/SearchForm';
import type { BookingMode } from '@/types';

// Multi-city is the only part of the search form that grows: each leg adds three
// fields, and the traveller can add or remove trailing legs.

/**
 * The card now asks the database which places a mode runs between, so the tests answer as
 * the endpoint would. What the *server* returns per mode is covered by its own tests; what is
 * covered here is that the card renders the list it was given and excludes the far end.
 */
const PLACES_BY_MODE: Record<string, { name: string; kind: string; region: string | null }[]> = {
  flights: [
    { name: 'Julius Nyerere International Airport', kind: 'airport', region: 'Dar es Salaam' },
    { name: 'Kilimanjaro International Airport', kind: 'airport', region: 'Kilimanjaro' },
  ],
  bus: [
    { name: 'Dar es Salaam', kind: 'city', region: 'Dar es Salaam' },
    { name: 'Arusha', kind: 'city', region: 'Arusha' },
    { name: 'Dodoma', kind: 'city', region: 'Dodoma' },
    { name: 'Babati', kind: 'town', region: 'Manyara' },
  ],
  train: [{ name: 'Dar es Salaam SGR Station', kind: 'station', region: 'Dar es Salaam' }],
  ferry: [{ name: 'Zanzibar', kind: 'port', region: null }],
  stays: [{ name: 'Arusha', kind: 'city', region: 'Arusha' }],
  experiences: [{ name: 'Arusha', kind: 'city', region: 'Arusha' }],
};

function stubLocationsEndpoint() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (!url.includes('/api/locations')) return Response.json({ data: [] });
      const mode = new URL(url, 'http://localhost').searchParams.get('mode') ?? 'bus';
      const places = PLACES_BY_MODE[mode] ?? [];
      return Response.json({
        data: places.map((place, index) => ({
          id: `location-${mode}-${index}`,
          name: place.name,
          code: place.name.slice(0, 3).toUpperCase(),
          kind: place.kind,
          countryCode: 'TZ',
          source: 'reference',
          region: place.region,
        })),
        count: places.length,
      });
    }),
  );
}

async function renderForm(mode: BookingMode = 'flights', locations: 'ok' | 'fail' = 'ok') {
  if (locations === 'fail') {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes('/api/locations')) return Promise.reject(new Error('offline'));
        return Response.json({ data: [] });
      }),
    );
  } else {
    stubLocationsEndpoint();
  }
  const rootRoute = createRootRoute({ component: Outlet });
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <SearchForm mode={mode} />,
  });
  const resultsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: `/${mode}/results`,
    component: () => <div>RESULTS PAGE</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute, resultsRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await router.load();

  return render(
    <I18nProvider>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </I18nProvider>,
  );
}

const legFieldCount = (container: HTMLElement) =>
  container.querySelectorAll('input[id^="leg_"]').length;

afterEach(() => {
  vi.unstubAllGlobals();
});

async function chooseMultiCity() {
  const { container } = await renderForm();
  fireEvent.click(screen.getByRole('button', { name: 'Multi-city' }));
  return container;
}

describe('SearchForm flight trip types', () => {
  it('uses a wider single-row desktop layout for non-flight modes but retains the flight layout', async () => {
    const busForm = await renderForm('bus');
    const busSearchForm = busForm.container.querySelector('.search-form');
    const busFieldGrid = busForm.container.querySelector('.search-form .grid');
    expect(busFieldGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-3');
    expect(busSearchForm).toHaveClass('min-[1280px]:grid');
    expect(busSearchForm).toHaveClass('min-[1280px]:items-end');
    expect(busSearchForm).toHaveClass('min-[1280px]:gap-x-4');
    expect(busSearchForm).toHaveClass('min-[1280px]:grid-cols-[repeat(4,minmax(0,1fr))_max-content]');
    expect(busSearchForm).toHaveClass('min-[1280px]:!h-auto');
    expect(busSearchForm).toHaveClass('min-[1280px]:!min-h-0');
    expect(busSearchForm).toHaveAttribute('data-desktop-grid', '1280');
    fireEvent.click(screen.getByRole('button', { name: 'Return' }));
    expect(busSearchForm).toHaveClass(
      'min-[1280px]:grid-cols-[repeat(5,minmax(0,1fr))_max-content]',
    );
    busForm.unmount();

    const ferryForm = await renderForm('ferry');
    expect(ferryForm.container.querySelector('.search-form')).toHaveClass(
      'min-[1280px]:grid-cols-[repeat(5,minmax(0,1fr))_max-content]',
    );
    ferryForm.unmount();

    const stayForm = await renderForm('stays');
    expect(stayForm.container.querySelector('.search-form .grid')).toHaveClass(
      'grid-cols-1',
      'sm:grid-cols-3',
    );
    expect(stayForm.container.querySelector('.search-form')).toHaveClass(
      'min-[1280px]:grid-cols-[repeat(4,minmax(0,1fr))_max-content]',
    );
    stayForm.unmount();

    const flightForm = await renderForm('flights');
    expect(flightForm.container.querySelector('.search-form')).not.toHaveClass('min-[1280px]:grid');
  });

  it('uses equal-width desktop fields when return dates are added', async () => {
    const ferryForm = await renderForm('ferry');
    fireEvent.click(screen.getByRole('button', { name: 'Return' }));

    expect(ferryForm.container.querySelector('.search-form')).toHaveClass(
      'min-[1440px]:grid-cols-[repeat(6,minmax(0,1fr))_max-content]',
    );
    expect(ferryForm.container.querySelector('.search-form')).toHaveAttribute('data-desktop-grid', '1440');
  });

  it('opens autocomplete and date-picker popups below their fields', async () => {
    await renderForm('bus');

    const from = screen.getByRole('combobox', { name: /From/ });
    fireEvent.focus(from);
    expect(from).toHaveAttribute('autocomplete', 'off');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('Start typing to search')).toBeInTheDocument();
    fireEvent.change(from, { target: { value: 'Dar' } });
    expect(await screen.findByRole('listbox')).toHaveClass('top-full');

    fireEvent.click(screen.getByRole('textbox', { name: /Departure Date/ }));
    expect(screen.getByRole('dialog', { name: /Departure Date/ })).toHaveClass('top-full');
  });

  it('keeps traveler controls inside a dropdown and updates its summary', async () => {
    await renderForm('bus');

    expect(screen.getByRole('button', { name: /Travelers: 1 traveler/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog', { name: 'Travelers' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Travelers: 1 traveler/ }));
    expect(screen.getByRole('dialog', { name: 'Travelers' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Travelers' })).toHaveClass('top-full');
    fireEvent.click(screen.getByRole('button', { name: 'Children: increase' }));
    fireEvent.click(screen.getByRole('button', { name: 'Infants: increase' }));

    expect(screen.getByRole('button', { name: /Travelers: 3 travelers/ })).toHaveTextContent('3 travelers');
    expect(screen.getByRole('button', { name: /Travelers: 3 travelers/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('keeps the search button in place when places fail to load', async () => {
    const { container } = await renderForm('bus', 'fail');
    const alert = await screen.findByRole('alert');
    const submit = screen.getByRole('button', { name: /Search Trips/ });
    const bottom = container.querySelector('.search-form-bottom');

    expect(alert).toHaveTextContent('Places could not be loaded');
    expect(container.querySelector('.search-form-status')).toContainElement(alert);
    expect(bottom?.contains(submit)).toBe(true);
    expect(bottom?.contains(alert)).toBe(false);
    expect(submit).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('does not require a second place for stays search', async () => {
    await renderForm('stays');
    fireEvent.click(screen.getByRole('button', { name: /Search Stays/ }));
    expect(screen.getByText('Please select a departure location')).toBeInTheDocument();
    expect(screen.queryByText('Please select a destination')).not.toBeInTheDocument();
  });

  it('navigates to stays results without a second place', async () => {
    await renderForm('stays');
    const destination = screen.getByRole('combobox', { name: /Destination/ });
    fireEvent.focus(destination);
    fireEvent.change(destination, { target: { value: 'Aru' } });
    fireEvent.click(await screen.findByRole('option', { name: /Arusha/ }));
    fireEvent.click(screen.getByPlaceholderText('Select check-in'));
    fireEvent.click(screen.getAllByRole('button', { name: /^[0-9]+$/ }).find((button) => !button.hasAttribute('disabled'))!);
    fireEvent.click(screen.getByPlaceholderText('Select check-out'));
    const checkoutDays = screen.getAllByRole('button', { name: /^[0-9]+$/ }).filter((button) => !button.hasAttribute('disabled'));
    fireEvent.click(checkoutDays[Math.min(1, checkoutDays.length - 1)]);
    fireEvent.click(screen.getByRole('button', { name: /Search Stays/ }));
    expect(await screen.findByText('RESULTS PAGE')).toBeInTheDocument();
  });

  it('includes rooms in the stays summary and closes the dropdown with Escape', async () => {
    await renderForm('stays');

    fireEvent.click(screen.getByRole('button', { name: /Travelers: 1 traveler, 1 room/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Rooms: increase' }));

    expect(screen.getByRole('button', { name: /Travelers: 1 traveler, 2 rooms/ })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Travelers' })).not.toBeInTheDocument();
  });

  it('starts one-way with the single-leg fields', async () => {
    await renderForm();

    expect(screen.getAllByPlaceholderText('Search location...')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Add flight leg/ })).not.toBeInTheDocument();
  });

  it('does not offer the selected origin as a flight destination', async () => {
    await renderForm();

    const origin = screen.getByRole('combobox', { name: /Origin Airport/ });
    fireEvent.focus(origin);
    fireEvent.change(origin, { target: { value: 'Julius' } });
    fireEvent.click(await screen.findByRole('option', { name: /Julius Nyerere International Airport/ }));
    const destination = screen.getByRole('combobox', { name: /Destination Airport/ });
    fireEvent.focus(destination);
    fireEvent.change(destination, { target: { value: 'Kili' } });

    await expect
      .poll(() => screen.queryByRole('option', { name: /Julius Nyerere International Airport/ }))
      .toBeNull();
  });

  it('offers bus cities rather than terminals and excludes the selected origin from the destination', async () => {
    await renderForm('bus');

    const from = screen.getByRole('combobox', { name: /From/ });
    fireEvent.focus(from);
    fireEvent.change(from, { target: { value: 'Dar' } });
    const darOption = await screen.findByRole('option', { name: /^Dar es Salaam City · Tanzania$/ });
    // A bus terminus is a place you board at, not a place you can travel to from the card.
    expect(darOption).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Ubungo Terminal/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Magomeni Terminal/ })).not.toBeInTheDocument();
    fireEvent.click(darOption);
    const to = screen.getByRole('combobox', { name: /To/ });
    fireEvent.focus(to);
    fireEvent.change(to, { target: { value: 'Dod' } });

    await expect
      .poll(() => screen.queryByRole('option', { name: /^Dar es Salaam City · Tanzania$/ }))
      .toBeNull();
    expect(await screen.findByRole('option', { name: /^Dodoma City · Tanzania$/ })).toBeInTheDocument();
  });

  it('shows two legs with three labelled fields each when multi-city is chosen', async () => {
    const container = await chooseMultiCity();
    const legGrid = container.querySelector('.search-form .space-y-3 > div.grid');

    expect(legFieldCount(container)).toBe(6);
    expect(legGrid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    expect(screen.getByText(/Flight leg 1: Departure$/)).toBeInTheDocument();
    expect(screen.getByText(/Flight leg 1: Destination/)).toBeInTheDocument();
    expect(screen.getByText(/Flight leg 1: Departure date/)).toBeInTheDocument();
    expect(screen.getByText(/Flight leg 2: Departure$/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add flight leg/ })).toBeInTheDocument();
  });

  it('does not offer to remove legs until a leg has been added', async () => {
    await chooseMultiCity();

    expect(screen.queryByRole('button', { name: /Remove last leg/ })).not.toBeInTheDocument();
  });

  it('adds a leg and allows removing it again', async () => {
    const container = await chooseMultiCity();

    fireEvent.click(screen.getByRole('button', { name: /Add flight leg/ }));
    expect(legFieldCount(container)).toBe(9);
    expect(screen.getByText(/Flight leg 3: Departure$/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Remove last leg/ }));
    expect(legFieldCount(container)).toBe(6);
    expect(screen.queryByText(/Flight leg 3: Departure$/)).not.toBeInTheDocument();
  });

  it('stops adding legs at five', async () => {
    const container = await chooseMultiCity();
    const addButton = screen.getByRole('button', { name: /Add flight leg/ });

    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(addButton);
    }

    expect(legFieldCount(container)).toBe(15);
    expect(addButton).toBeDisabled();
  });

  it('requires departure, destination and date for every leg', async () => {
    await chooseMultiCity();

    fireEvent.click(screen.getByRole('button', { name: /Search Trips/ }));

    expect(screen.getAllByText('Please select a departure airport or city')).toHaveLength(2);
    expect(screen.getAllByText('Please select a destination airport or city')).toHaveLength(2);
    expect(screen.getAllByText('Please select a departure date')).toHaveLength(2);
    expect(screen.queryByText('RESULTS PAGE')).not.toBeInTheDocument();
  });
});
