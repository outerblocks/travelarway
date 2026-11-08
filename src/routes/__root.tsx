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
import { OfflineBanner, ScrollToTop } from '@/components/layout/ScrollToTop';
import { RouteError, RoutePending } from '@/components/shared/RouteStates';
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

const isViteDev = process.env.NODE_ENV !== 'production';

const DOCUMENT_SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    isViteDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    isViteDev
      ? "connect-src 'self' ws: wss: https://api.clickpesa.com"
      : "connect-src 'self' https://api.clickpesa.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isViteDev ? [] : ['upgrade-insecure-requests']),
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

export const Route = createRootRoute({
  headers: () => DOCUMENT_SECURITY_HEADERS,
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
  pendingComponent: RoutePending,
  notFoundComponent: () => <h1 className="p-8 text-center text-2xl font-bold">Page not found</h1>,
  errorComponent: ({ reset }) => <RouteError reset={reset} />,
});

function AppLayout() {
  const location = useLocation();
  const shell = isShellRoute(location.pathname);
  const fullPage = isFullPageRoute(location.pathname);

  return (
    <AppProvider>
      <AuthProvider>
        <I18nProvider>
          <ScrollToTop />
          <OfflineBanner />
          {shell ? (
            <div className="min-h-screen bg-background">
              <Outlet />
            </div>
          ) : fullPage ? (
            <div className="min-h-screen bg-background">
              <Outlet />
            </div>
          ) : (
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
