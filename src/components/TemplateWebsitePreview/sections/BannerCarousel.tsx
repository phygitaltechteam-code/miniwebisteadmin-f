import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionProps } from '../useTemplateModel';

/** Auto-sliding banners (mobile: under the profile card; desktop: full width above the hero) */
export const BannerCarousel: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, banners, bannerSlider } = t;
  const bannerTouchX = useRef<number | null>(null);
  return (
    <section className={isMobile ? 'bg-white px-4 pb-5' : 'bg-[var(--b1)]'}>
      <div
        className={`group relative overflow-hidden bg-slate-100 ${isMobile ? 'rounded-2xl shadow-lg aspect-[16/9]' : 'aspect-[3/1]'}`}
        {...bannerSlider.hoverProps}
        onTouchStart={(e) => { bannerTouchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (bannerTouchX.current === null) return;
          const dx = e.changedTouches[0].clientX - bannerTouchX.current;
          if (Math.abs(dx) > 40) (dx < 0 ? bannerSlider.next : bannerSlider.prev)();
          bannerTouchX.current = null;
        }}
      >
        {/* Sliding track: every banner side by side, moved by translateX */}
        <div
          className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${bannerSlider.start * 100}%)` }}
        >
          {banners.map((b, i) => (
            // A single banner stays still; two or more slide
            <img key={`${b}-${i}`} src={b} alt="" className="w-full h-full shrink-0 object-cover" draggable={false} />
          ))}
        </div>
        {!isMobile && banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={bannerSlider.prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/35 hover:bg-[var(--c)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={bannerSlider.next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/35 hover:bg-[var(--c)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Next banner"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        {banners.length > 1 && (
          <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => bannerSlider.goTo(i)}
                className={`h-1.5 rounded-full shadow transition-all duration-300 ${i === bannerSlider.start ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
                aria-label={`Banner ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
