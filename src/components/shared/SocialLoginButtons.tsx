import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

const PROVIDERS = [
  { id: 'google' as const, label: 'Google', icon: GoogleIcon },
  { id: 'apple' as const, label: 'Apple', icon: AppleIcon },
];

export function SocialLoginButtons({ disabled }: { disabled?: boolean }) {
  const { signInWithProvider } = useAuth();
  const { tp } = useI18n();
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  const handleProvider = async (provider: 'google' | 'apple') => {
    setBusyProvider(provider);
    await signInWithProvider(provider);
    setBusyProvider(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-meta text-neutral-400 font-medium">{tp('orContinueWith')}</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            disabled={disabled || busyProvider !== null}
            onClick={() => handleProvider(id)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-300 rounded-sm bg-white text-body font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            aria-label={tp('continueWithProvider').replace('{provider}', label)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {busyProvider && (
        <p className="text-meta text-neutral-500 text-center">
          {tp('connectingToProvider').replace('{provider}', busyProvider)}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M16.37 12.76c.02 2.16 1.89 2.88 1.91 2.89-.02.05-.3 1.02-.98 2.02-.59.86-1.2 1.72-2.17 1.74-.95.02-1.25-.56-2.34-.56-1.08 0-1.42.54-2.32.58-.93.03-1.64-.93-2.24-1.79-1.22-1.76-2.15-4.98-.9-7.16.62-1.08 1.74-1.76 2.95-1.78.92-.02 1.78.62 2.34.62.56 0 1.62-.76 2.72-.65.46.02 1.76.19 2.6 1.41-.07.04-1.55.91-1.53 2.7M14.6 6.93c.5-.6.84-1.44.75-2.28-.72.03-1.6.48-2.12 1.08-.46.53-.87 1.38-.76 2.2.81.06 1.63-.41 2.13-1" />
    </svg>
  );
}
