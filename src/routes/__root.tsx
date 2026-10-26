import type { ReactNode } from 'react';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useLocation,
} from '@tanstack/react-router';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { I18nProvider } from '@/context/I18nContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import appCss from '../index.css?url';

/** Routes that render inside their own full-screen shell (no public header/footer). */
const SHELL_ROUTES = ['/hq', '/dashboard', '/operator/bus', '/operator/ferry', '/operator/hims-signin', '/operator/oims-signin'];

function isShellRoute(pathname: string): boolean {
  return SHELL_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
}

/** Routes that are full-page (auth pages, etc.) — no header/footer but different bg. */
const FULLPAGE_ROUTES = ['/signin', '/register'];

function isFullPageRoute(pathname: string): boolean {
  return FULLPAGE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { title: 'Travelar - Multimodal Travel Booking' },
      {
        name: 'description',
        content: 'Book bus, ferry, flights, train, stays, and experiences across Tanzania and beyond with Travelar.',
      },
      { property: 'og:title', content: 'Travelar - Multimodal Travel Booking' },
      {
        property: 'og:description',
        content: 'Book bus, ferry, flights, train, stays, and experiences across Tanzania and beyond.',
      },
      { property: 'og:image', content: '/travelar-logo.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: '/travelar-logo.png' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
    ],
  }),
  component: AppLayout,
  shellComponent: RootDocument,
  notFoundComponent: () => <h1 className="p-8 text-center text-2xl font-bold">Page not found</h1>,
  // Rendered without the app providers, so it must stay self-contained.
  errorComponent: ({ reset }) => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="text-page font-bold text-neutral-900">Something went wrong</h1>
      <p className="max-w-md text-body text-neutral-500">
        This page could not be displayed. Try again, or return to the home page.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <a href="/" className="btn-secondary">Back to home</a>
      </div>
    </div>
  ),
});

function AppLayout() {
  const location = useLocation();
  const shell = isShellRoute(location.pathname);
  const fullPage = isFullPageRoute(location.pathname);

  return (
    <AppProvider>
      <AuthProvider>
        <I18nProvider>
          {shell ? (
            // Management dashboards — full-screen, no public header/footer
            <div className="min-h-screen bg-background">
              <Outlet />
            </div>
          ) : fullPage ? (
            // Auth pages — full-screen with background, no header/footer
            <div className="min-h-screen bg-background">
              <Outlet />
            </div>
          ) : (
            // Public site — standard header + footer layout
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                <Outlet />
              </main>
              <Footer />
            </div>
          )}
        </I18nProvider>
      </AuthProvider>
    </AppProvider>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
