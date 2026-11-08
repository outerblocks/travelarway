import { useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import { StayLightbox } from '@/components/stays/StayLightbox';
import { StayPhoto } from '@/components/stays/StayPhoto';

const DETAIL_PREVIEW = 6;

export function StayGallery({
  urls,
  name,
  layout = 'detail',
}: {
  urls: string[];
  name: string;
  layout?: 'detail' | 'card';
}) {
  const { tp } = useI18n();
  const https = urls.filter((url) => url.startsWith('https://'));
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (!https.length) {
    return <StayPhoto urls={[]} name={name} className={layout === 'card' ? 'h-52 w-full sm:h-full sm:min-h-[12.5rem]' : 'h-64 w-full sm:h-80'} />;
  }

  const preview = layout === 'card' ? https.slice(0, 1) : https.slice(0, DETAIL_PREVIEW);
  const remaining = https.length - preview.length;

  return (
    <>
      {layout === 'card' ? (
        <button
          type="button"
          className="relative block h-52 w-full sm:h-full sm:min-h-[12.5rem]"
          onClick={() => setOpenAt(0)}
          aria-label={tp('viewPhotos')}
        >
          <StayPhoto urls={preview} name={name} className="h-full w-full" />
          {https.length > 1 ? (
            <span className="absolute bottom-2 left-2 rounded-sm bg-black/70 px-2 py-0.5 text-meta text-white">
              {tp('photoCount').replace('{count}', String(https.length))}
            </span>
          ) : null}
        </button>
      ) : (
        <div>
          <div className={`grid gap-2 ${https.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {preview.map((url, index) => {
              const isHero = index === 0 && https.length > 1;
              const isLast = index === preview.length - 1 && remaining > 0;
              return (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  className={`relative block overflow-hidden ${isHero ? 'col-span-2 h-56 sm:col-span-2 sm:h-72' : 'h-28 sm:h-36'}`}
                  onClick={() => setOpenAt(index)}
                  aria-label={isLast ? tp('viewAllPhotos').replace('{count}', String(https.length)) : tp('viewPhoto')}
                >
                  <StayPhoto urls={[url]} name={name} className="h-full w-full" />
                  {isLast ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/65 text-body font-semibold text-white">
                      {tp('viewAllPhotos').replace('{count}', String(https.length))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {https.length > DETAIL_PREVIEW ? (
            <button type="button" className="mt-3 text-label font-medium text-brand-700" onClick={() => setOpenAt(0)}>
              {tp('viewAllPhotos').replace('{count}', String(https.length))}
            </button>
          ) : null}
        </div>
      )}
      {openAt != null ? (
        <StayLightbox
          urls={https}
          name={name}
          index={openAt}
          onIndex={setOpenAt}
          onClose={() => setOpenAt(null)}
        />
      ) : null}
    </>
  );
}
