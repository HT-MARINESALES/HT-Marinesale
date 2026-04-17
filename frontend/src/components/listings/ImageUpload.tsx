import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Star, Trash2, GripVertical, AlertCircle, RotateCcw, Loader2, ImagePlus, X } from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import type { ListingImage } from '@/types';

interface PendingImage {
  localId: string;
  file: File;
  preview: string;
  status: 'uploading' | 'error';
  errorMsg?: string;
}

interface ImageUploadProps {
  listingId: string;
  images: ListingImage[];
  onImagesChange: (images: ListingImage[]) => void;
}

const MAX_IMAGES = 10;

export function ImageUpload({ listingId, images, onImagesChange }: ImageUploadProps) {
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const { error: showError } = useToast();

  // Revoke all preview URLs on unmount
  useEffect(() => {
    return () => {
      pending.forEach(p => URL.revokeObjectURL(p.preview));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadingCount = pending.filter(p => p.status === 'uploading').length;
  const totalSlots = images.length + uploadingCount;
  const canUpload = totalSlots < MAX_IMAGES;

  // Upload a single file; returns updated images array on success, current on failure
  const uploadSingle = async (item: PendingImage, currentImages: ListingImage[]): Promise<ListingImage[]> => {
    try {
      const formData = new FormData();
      formData.append('image', item.file);
      const uploaded = await api.upload<ListingImage>(`/seller/images/${listingId}`, formData);
      const updated = [...currentImages, uploaded];
      onImagesChange(updated);
      setPending(prev => prev.filter(p => p.localId !== item.localId));
      URL.revokeObjectURL(item.preview);
      return updated;
    } catch (err) {
      setPending(prev => prev.map(p =>
        p.localId === item.localId
          ? { ...p, status: 'error', errorMsg: err instanceof Error ? err.message : 'Upload fehlgeschlagen' }
          : p
      ));
      return currentImages;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const slots = MAX_IMAGES - totalSlots;
    let files = acceptedFiles;
    if (files.length > slots) {
      showError('Zu viele Bilder', `Noch ${slots} Bild${slots !== 1 ? 'er' : ''} möglich (max. ${MAX_IMAGES})`);
      files = files.slice(0, slots);
    }
    if (files.length === 0) return;

    // Instant previews — show all thumbnails immediately before any upload
    const newPending: PendingImage[] = files.map(file => ({
      localId: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading' as const,
    }));

    setPending(prev => [...prev, ...newPending]);

    // Upload sequentially so we don't race on onImagesChange
    let currentImages = [...images];
    for (const item of newPending) {
      currentImages = await uploadSingle(item, currentImages);
    }
  }, [images, totalSlots, listingId, onImagesChange, showError]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = async (item: PendingImage) => {
    setPending(prev => prev.map(p =>
      p.localId === item.localId ? { ...p, status: 'uploading', errorMsg: undefined } : p
    ));
    await uploadSingle(item, images);
  };

  const handleDismiss = (localId: string, preview: string) => {
    setPending(prev => prev.filter(p => p.localId !== localId));
    URL.revokeObjectURL(preview);
  };

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId);
    try {
      await api.delete(`/seller/images/${imageId}`);
      onImagesChange(images.filter(img => img.id !== imageId));
    } catch (err) {
      showError('Löschen fehlgeschlagen', err instanceof Error ? err.message : 'Fehler');
    }
    setDeletingId(null);
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await api.put(`/seller/images/${imageId}/primary`, {});
      onImagesChange(images.map(img => ({ ...img, is_primary: img.id === imageId })));
    } catch {
      showError('Fehler', 'Hauptbild konnte nicht gesetzt werden');
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragIdRef.current) setDragOverId(id);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const sourceId = dragIdRef.current;
    if (!sourceId || sourceId === targetId) return;
    const sourceIdx = images.findIndex(img => img.id === sourceId);
    const targetIdx = images.findIndex(img => img.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;
    const reordered = [...images];
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    const withOrder = reordered.map((img, i) => ({ ...img, sort_order: i }));
    onImagesChange(withOrder);
    try {
      await api.put('/seller/images/reorder', {
        order: withOrder.map(img => ({ id: img.id, sort_order: img.sort_order })),
      });
    } catch {
      showError('Fehler', 'Reihenfolge konnte nicht gespeichert werden');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    disabled: !canUpload,
  });

  const allCards = [
    ...images.map((img, i) => ({ type: 'uploaded' as const, img, position: i + 1 })),
    ...pending.map(p => ({ type: 'pending' as const, p })),
  ];

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {canUpload && (
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 select-none',
            isDragActive
              ? 'border-navy-500 bg-navy-50'
              : 'border-gray-200 bg-gray-50/60 hover:border-navy-400 hover:bg-gray-50'
          )}
        >
          <input {...getInputProps()} />

          <div className={cn(
            'inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 transition-colors',
            isDragActive ? 'bg-navy-100 text-navy-600' : 'bg-white text-gray-400 shadow-sm border border-gray-200'
          )}>
            {isDragActive ? <ImagePlus className="h-6 w-6" /> : <Upload className="h-5 w-5" />}
          </div>

          {isDragActive ? (
            <p className="text-navy-700 font-semibold text-sm">Bilder hier ablegen</p>
          ) : (
            <>
              <p className="text-gray-800 font-semibold text-sm">
                Klicken zum Auswählen{' '}
                <span className="font-normal text-gray-400">oder Bilder hierher ziehen</span>
              </p>
              <p className="text-xs text-gray-400 mt-1.5 space-x-1">
                <span>JPEG · PNG · WebP</span>
                <span>·</span>
                <span>max. 10 MB pro Bild</span>
                <span>·</span>
                <span>{MAX_IMAGES - totalSlots} von {MAX_IMAGES} Plätzen frei</span>
              </p>
            </>
          )}
        </div>
      )}

      {/* Full indicator when limit reached */}
      {!canUpload && pending.length === 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <Star className="h-4 w-4 fill-green-400 text-green-400 shrink-0" />
          Maximale Anzahl an Bildern erreicht ({MAX_IMAGES}/{MAX_IMAGES})
        </div>
      )}

      {/* Image grid */}
      {allCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {allCards.map(card => {
            if (card.type === 'uploaded') {
              const { img, position } = card;
              const isDeleting = deletingId === img.id;
              return (
                <div
                  key={img.id}
                  draggable={!isDeleting}
                  onDragStart={(e) => handleDragStart(e, img.id)}
                  onDragOver={(e) => handleDragOver(e, img.id)}
                  onDrop={(e) => handleDrop(e, img.id)}
                  onDragLeave={() => setDragOverId(null)}
                  onDragEnd={() => { dragIdRef.current = null; setDragOverId(null); }}
                  className={cn(
                    'relative group rounded-xl overflow-hidden aspect-square bg-gray-100 transition-all duration-150',
                    dragOverId === img.id
                      ? 'ring-2 ring-navy-500 ring-offset-2 scale-95'
                      : 'hover:shadow-lg',
                    isDeleting ? 'opacity-40 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                  )}
                >
                  <img
                    src={getImageUrl(img.storage_path)}
                    alt=""
                    className="w-full h-full object-cover pointer-events-none"
                    loading="lazy"
                  />

                  {/* Primary badge */}
                  {img.is_primary && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-flex items-center gap-1 bg-amber-400 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                        <Star className="h-2.5 w-2.5 fill-white" />
                        Titelbild
                      </span>
                    </div>
                  )}

                  {/* Position number + drag handle (top right, on hover) */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <div className="bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
                      #{position}
                    </div>
                    <div className="bg-black/60 text-white p-1 rounded">
                      <GripVertical className="h-3 w-3" />
                    </div>
                  </div>

                  {/* Hover actions overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                    <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-center gap-2">
                      {!img.is_primary && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSetPrimary(img.id); }}
                          className="flex items-center gap-1 bg-amber-400 hover:bg-amber-500 text-white text-[11px] px-2 py-1.5 rounded-lg font-semibold transition-colors shadow-sm"
                          title="Als Titelbild setzen"
                        >
                          <Star className="h-3 w-3" />
                          Titelbild
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}
                        disabled={isDeleting}
                        className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white p-1.5 rounded-lg transition-colors shadow-sm"
                        title="Bild löschen"
                      >
                        {isDeleting
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              // Pending (uploading or error)
              const { p } = card;
              return (
                <div
                  key={p.localId}
                  className="relative rounded-xl overflow-hidden aspect-square bg-gray-200"
                >
                  <img
                    src={p.preview}
                    alt=""
                    className={cn(
                      'w-full h-full object-cover pointer-events-none transition-opacity',
                      p.status === 'error' ? 'opacity-30' : 'opacity-60'
                    )}
                  />

                  {p.status === 'uploading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      {/* Spinning ring */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full border-3 border-white/30 border-t-white animate-spin" style={{ borderWidth: 3 }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Upload className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <span className="text-white text-[11px] font-semibold drop-shadow bg-black/30 px-2 py-0.5 rounded-full">
                        Hochladen…
                      </span>
                    </div>
                  )}

                  {p.status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
                      <div className="bg-red-500 text-white rounded-full p-1.5">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <span className="text-white text-[11px] font-semibold text-center leading-tight drop-shadow">
                        {p.errorMsg ?? 'Upload fehlgeschlagen'}
                      </span>
                      <div className="flex gap-1.5 mt-0.5">
                        <button
                          onClick={() => handleRetry(p)}
                          className="inline-flex items-center gap-1 bg-white text-gray-800 text-[11px] px-2 py-1 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Erneut
                        </button>
                        <button
                          onClick={() => handleDismiss(p.localId, p.preview)}
                          className="bg-white/20 hover:bg-white/40 text-white p-1 rounded-lg transition-colors"
                          title="Entfernen"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          })}
        </div>
      )}

      {/* Footer info */}
      {allCards.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
          <span>
            {images.length} Bild{images.length !== 1 ? 'er' : ''} hochgeladen
            {uploadingCount > 0 && (
              <span className="ml-1.5 text-blue-500 font-medium inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {uploadingCount} {uploadingCount === 1 ? 'wird' : 'werden'} hochgeladen
              </span>
            )}
          </span>
          {images.length > 1 && (
            <span>Reihenfolge per Drag&amp;Drop · Stern = Titelbild</span>
          )}
        </div>
      )}
    </div>
  );
}
