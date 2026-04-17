import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import type { ListingImage } from '@/types';

interface ImageGalleryProps {
  images: ListingImage[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center text-gray-400">
        Keine Bilder verfügbar
      </div>
    );
  }

  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

  const prev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + sorted.length) % sorted.length);
  };

  const next = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % sorted.length);
  };

  return (
    <>
      {/* Main image + thumbnails */}
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative overflow-hidden rounded-xl bg-gray-100 cursor-pointer aspect-[4/3]"
          onClick={() => setLightboxIndex(0)}
        >
          <img
            src={getImageUrl(sorted[0]?.storage_path)}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {sorted.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              +{sorted.length - 1} Fotos
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {sorted.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {sorted.slice(1, 5).map((img, i) => (
              <div
                key={img.id}
                className="relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer aspect-square hover:opacity-90 transition-opacity"
                onClick={() => setLightboxIndex(i + 1)}
              >
                <img
                  src={getImageUrl(img.storage_path)}
                  alt={`${title} - Bild ${i + 2}`}
                  className="w-full h-full object-cover"
                />
                {i === 3 && sorted.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-sm">
                    +{sorted.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-8 w-8" />
          </button>

          {sorted.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10 p-2"
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10 p-2"
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(sorted[lightboxIndex]?.storage_path)}
              alt={title}
              className="max-h-[80vh] max-w-full object-contain"
            />
            <p className="text-center text-gray-400 text-sm mt-2">
              {lightboxIndex + 1} / {sorted.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
