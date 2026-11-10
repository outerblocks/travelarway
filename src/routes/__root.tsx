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
import { RouteError } from '@/components/shared/RouteStates';
import { SeoJsonLd } from '@/components/shared/SeoJsonLd';
import { RouteWaitProvider } from '@/components/shared/TravelarLoader';
import { isNoindexPath, langFromSearch } from '@/domain/seo';
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
  headers: ({ matches }) => {
    const pathname = matches?.at(-1)?.pathname ?? '/';
    const extra = isNoindexPath(pathname) ? { 'X-Robots-Tag': 'noindex, nofollow' } : {};
    return { ...DOCUMENT_SECURITY_HEADERS, ...extra };
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
      { name: 'theme-color', content: '#0055dd' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),
  component: AppLayout,
  shellComponent: RootDocument,
  notFoundComponent: () => <h1 className="p-8 text-center text-2xl font-bold">Page not found</h1>,
  errorComponent: ({ reset }) => <RouteError reset={reset} />,
});

function AppLayout() {
  const location = useLocation();
  const shell = isShellRoute(location.pathname);
  const fullPage = isFullPageRoute(location.pathname);
  const urlLang = langFromSearch(location.search);

  return (
    <AppProvider>
      <AuthProvider>
        <I18nProvider urlLang={urlLang}>
          <RouteWaitProvider>
            <ScrollToTop />
            <OfflineBanner />
            <SeoJsonLd />
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
          </RouteWaitProvider>
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
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
