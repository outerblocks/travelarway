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
import { HeroSearchCard } from '@/components/search/HeroSearchCard';
import { resetSearchPlacesCache } from '@/components/search/SearchForm';

afterEach(() => {
  vi.unstubAllGlobals();
  resetSearchPlacesCache();
});

async function renderCard() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ data: [], count: 0 })),
  );
  const rootRoute = createRootRoute({ component: Outlet });
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: HeroSearchCard,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute]),
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

describe('HeroSearchCard', () => {
  it('keeps mode tabs in a horizontal scroller and switches every form', async () => {
    await renderCard();
    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveClass('hero-search-tabs');

    for (const name of ['Search Bus', 'Search Ferry', 'Search Flight', 'Search Trains', 'Search Stays', 'Search Experiences']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole('tab', { name: 'Search Stays' }));
    expect(screen.getByRole('tab', { name: 'Search Stays' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: /Search Stays/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Search Experiences' }));
    expect(screen.getByRole('tab', { name: 'Search Experiences' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Search Experiences/ })).toBeInTheDocument();
  });
});
