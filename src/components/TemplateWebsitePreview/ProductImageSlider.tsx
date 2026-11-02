import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAutoSlide } from './useAutoSlide';

/**
 * Product photos, sliding like the banner when there is more than one.
 * Card: auto-slides with dots. Popup (withControls): arrows + thumbnails; clicking the photo calls onOpen.
 */
export const ProductImageSlider: React.FC<{
  images: string[];
  alt: string;
  onOpen?: (src: string) => void;
  withControls?: boolean;
  className?: string;
  imgClassName?: string;
}> = ({ images, alt, onOpen, withControls = false, className = '', imgClassName = '' }) => {
  const slider = useAutoSlide(images.length, 1, 3000, true);
  const touchStart = useRef<number | null>(null);
  if (images.length === 0) return null;
  return (
    <div className={`relative overflow-hidden ${className}`} {...slider.hoverProps}>
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${slider.start * 100}%)` }}
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStart.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(dx) > 40) (dx < 0 ? slider.next : slider.prev)();
          touchStart.current = null;
        }}
      >
        {images.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`${alt} ${i + 1}`}
            draggable={false}
            onClick={() => onOpen?.(src)}
            className={`w-full h-full shrink-0 object-contain ${onOpen ? 'cursor-pointer' : ''} ${imgClassName}`}
          />
        ))}
      </div>
      {images.length > 1 && withControls && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); slider.prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-[var(--c)] text-white flex items-center justify-center"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); slider.next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-[var(--c)] text-white flex items-center justify-center"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white">
            {slider.start + 1}/{images.length}
          </span>
        </>
      )}
      {images.length > 1 && !withControls && (
        <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-1">
          {images.slice(0, 10).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); slider.goTo(i); }}
              className={`h-1.5 rounded-full shadow transition-all ${i === slider.start ? 'w-4 bg-[var(--c)]' : 'w-1.5 bg-slate-300'}`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
      {withControls && images.length > 1 && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent pt-6 pb-2 px-2 overflow-x-auto">
          <div className="flex w-max mx-auto gap-1.5">
            {images.map((src, i) => (
              <button
                key={`thumb-${src}-${i}`}
                type="button"
                onClick={(e) => { e.stopPropagation(); slider.goTo(i); }}
                className={`w-10 h-10 shrink-0 rounded-md overflow-hidden border-2 bg-white ${i === slider.start ? 'border-[var(--c)]' : 'border-transparent opacity-70 hover:opacity-100'}`}
                aria-label={`Show image ${i + 1}`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
