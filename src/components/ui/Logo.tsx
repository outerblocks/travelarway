import travelarLogo from '@/assets/logo/travelar-logo.png';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ variant = 'dark', size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'h-10 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
  } as const;

  const filter = variant === 'light' ? 'brightness(0) invert(1)' : 'none';

  return (
    <div className="flex items-center gap-2 select-none">
      <img
        src={travelarLogo}
        alt=""
        aria-hidden="true"
        className={`${sizes[size]} object-contain ${variant === 'light' ? 'drop-shadow-sm' : ''}`}
        style={{ filter }}
        loading="eager"
      />
      <span className={`text-2xl font-bold tracking-tight ${variant === 'light' ? 'text-white' : 'text-brand-600'}`}>
        Travelar
      </span>
    </div>
  );
}
