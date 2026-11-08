import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

/**
 * Booking.com-style property photos: "View all" is a full-page album of every
 * image, not a slideshow. A tap on a photo then fills the viewport.
 */
export function StayLightbox({
  urls,
  name,
  index,
  mode,
  onIndex,
  onMode,
  onClose,
}: {
  urls: string[];
  name: string;
  index: number;
  mode: 'album' | 'zoom';
  onIndex: (index: number) => void;
  onMode: (mode: 'album' | 'zoom') => void;
  onClose: () => void;
}) {
  const { tp } = useI18n();
  const total = urls.length;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (mode === 'zoom') onMode('album');
        else onClose();
      }
      if (mode !== 'zoom') return;
      if (event.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      if (event.key === 'ArrowRight' && index < total - 1) onIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [index, mode, onClose, onIndex, onMode, total]);

  if (typeof document === 'undefined') return null;

  const dialog = (
    <div
      className="fixed inset-0 z-[400] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label={tp('propertyPhotos')}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-neutral-200 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-neutral-900">{name}</p>
          <p className="text-meta text-neutral-600">
            {mode === 'zoom'
              ? tp('photoOf').replace('{current}', String(index + 1)).replace('{total}', String(total))
              : tp('photoCount').replace('{count}', String(total))}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {mode === 'zoom' ? (
            <button type="button" className="btn-ghost text-label" onClick={() => onMode('album')}>
              {tp('backToPhotoAlbum')}
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-md p-2 text-neutral-800 hover:bg-neutral-100"
            onClick={onClose}
            aria-label={tp('closePhotos')}
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {mode === 'album' ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
          <div className="columns-1 gap-2 sm:columns-2 lg:columns-3">
            {urls.map((url, photoIndex) => (
              <button
                key={`${url}-${photoIndex}`}
                type="button"
                className="mb-2 block w-full break-inside-avoid overflow-hidden bg-neutral-100"
                onClick={() => {
                  onIndex(photoIndex);
                  onMode('zoom');
                }}
                aria-label={tp('viewPhoto')}
              >
                <img
                  src={url}
                  alt={`${name} ${tp('propertyPhoto')} ${photoIndex + 1}`}
                  className="block h-auto w-full"
                  loading={photoIndex > 5 ? 'lazy' : 'eager'}
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <StayZoom urls={urls} name={name} index={index} onIndex={onIndex} />
      )}
    </div>
  );

  return createPortal(dialog, document.body);
}

function StayZoom({
  urls,
  name,
  index,
  onIndex,
}: {
  urls: string[];
  name: string;
  index: number;
  onIndex: (index: number) => void;
}) {
  const { tp } = useI18n();
  const src = urls[index];
  if (!src) return null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-neutral-950">
      <div className="relative min-h-0 flex-1">
        <img
          src={src}
          alt={`${name} ${tp('propertyPhoto')} ${index + 1}`}
          className="absolute inset-0 h-full w-full object-contain"
        />
        {index > 0 ? (
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md bg-white/90 p-2 text-neutral-900 hover:bg-white"
            onClick={() => onIndex(index - 1)}
            aria-label={tp('previousPhoto')}
          >
            <ChevronLeft size={28} />
          </button>
        ) : null}
        {index < urls.length - 1 ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white/90 p-2 text-neutral-900 hover:bg-white"
            onClick={() => onIndex(index + 1)}
            aria-label={tp('nextPhoto')}
          >
            <ChevronRight size={28} />
          </button>
        ) : null}
      </div>
      {urls.length > 1 ? (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-t border-white/10 bg-neutral-950 px-3 py-2">
          {urls.map((url, photoIndex) => (
            <button
              key={`${url}-thumb-${photoIndex}`}
              type="button"
              className={`h-14 w-20 shrink-0 overflow-hidden ${photoIndex === index ? 'ring-2 ring-brand-500' : 'opacity-70 hover:opacity-100'}`}
              onClick={() => onIndex(photoIndex)}
              aria-label={tp('photoOf').replace('{current}', String(photoIndex + 1)).replace('{total}', String(urls.length))}
              aria-current={photoIndex === index}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
