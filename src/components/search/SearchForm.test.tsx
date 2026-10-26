import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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

async function renderForm(mode: BookingMode = 'flights') {
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

    fireEvent.focus(screen.getByRole('combobox', { name: /From/ }));
    expect(screen.getByRole('listbox')).toHaveClass('top-full');

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

    fireEvent.focus(screen.getByRole('combobox', { name: /Origin Airport/ }));
    fireEvent.click(screen.getByRole('option', { name: /Julius Nyerere International Airport/ }));
    fireEvent.focus(screen.getByRole('combobox', { name: /Destination Airport/ }));

    expect(
      screen.queryByRole('option', { name: /Julius Nyerere International Airport/ }),
    ).not.toBeInTheDocument();
  });

  it('offers bus cities rather than terminals and excludes the selected origin from the destination', async () => {
    await renderForm('bus');

    fireEvent.focus(screen.getByRole('combobox', { name: /From/ }));
    expect(screen.queryByRole('option', { name: /Ubungo Terminal/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Magomeni Terminal/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: /^Dar es Salaam Dar es Salaam, Tanzania$/ }));
    fireEvent.focus(screen.getByRole('combobox', { name: /To/ }));

    expect(
      screen.queryByRole('option', { name: /^Dar es Salaam Dar es Salaam, Tanzania$/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /^Dodoma Dodoma, Tanzania$/ })).toBeInTheDocument();
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
