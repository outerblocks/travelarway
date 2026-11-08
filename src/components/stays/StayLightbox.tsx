import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

export function StayLightbox({
  urls,
  name,
  index,
  onIndex,
  onClose,
}: {
  urls: string[];
  name: string;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const { tp } = useI18n();
  const src = urls[index];
  const total = urls.length;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      if (event.key === 'ArrowRight' && index < total - 1) onIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [index, onClose, onIndex, total]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[400] flex flex-col bg-ink/95"
      role="dialog"
      aria-modal="true"
      aria-label={tp('propertyPhotos')}
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-white">
        <p className="min-w-0 truncate text-body">
          {name}
          <span className="ml-3 text-meta text-white/70">
            {tp('photoOf').replace('{current}', String(index + 1)).replace('{total}', String(total))}
          </span>
        </p>
        <button
          type="button"
          className="shrink-0 rounded-md p-2 text-white hover:bg-white/10"
          onClick={onClose}
          aria-label={tp('closePhotos')}
        >
          <X size={22} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 pb-6" onClick={(event) => event.stopPropagation()}>
        <img src={src} alt={`${name} ${tp('propertyPhoto')} ${index + 1}`} className="max-h-full max-w-full object-contain" />
        {index > 0 ? (
          <button
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => onIndex(index - 1)}
            aria-label={tp('previousPhoto')}
          >
            <ChevronLeft size={28} />
          </button>
        ) : null}
        {index < total - 1 ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => onIndex(index + 1)}
            aria-label={tp('nextPhoto')}
          >
            <ChevronRight size={28} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
