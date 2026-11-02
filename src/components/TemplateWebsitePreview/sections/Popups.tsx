import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Mail, X, Download } from 'lucide-react';
import { cleanRichHtml, RICH_TEXT_CLASS } from '@/utils/richText';
import { SectionProps } from '../useTemplateModel';
import { ProductImageSlider } from '../ProductImageSlider';
import { formatPrice, productImages, downloadImage } from '../helpers';

/** Full-screen gallery viewer: arrows, swipe, caption and thumbnails */
export const GalleryLightbox: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, gallery, lightbox, setLightbox, stepLightbox } = t;
  const touchX = useRef<number | null>(null);
  if (lightbox === null || !gallery[lightbox]) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={() => setLightbox(null)}
      className="fixed inset-0 z-[80] flex flex-col bg-black/90 backdrop-blur-sm text-white tpl-fade-in"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <span className="text-[13px] font-medium text-white/80">
          {lightbox + 1} / {gallery.length}
        </span>
        <button
          type="button"
          onClick={() => setLightbox(null)}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image + arrows (swipe on touch) */}
      <div
        className={`relative flex-1 min-h-0 flex items-center justify-center ${isMobile ? 'px-3' : 'px-16'}`}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) stepLightbox(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <img
          key={lightbox}
          src={gallery[lightbox].url || gallery[lightbox].image}
          alt={gallery[lightbox].title || ''}
          onClick={(e) => e.stopPropagation()}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl tpl-fade-in"
        />
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); stepLightbox(-1); }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-[var(--c)] flex items-center justify-center transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); stepLightbox(1); }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-[var(--c)] flex items-center justify-center transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Caption + thumbnails */}
      <div className="px-4 pt-3 pb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        {(gallery[lightbox].title || gallery[lightbox].description) && (
          <div className="text-center">
            {gallery[lightbox].title && <p className="text-[14px] font-semibold">{gallery[lightbox].title}</p>}
            {gallery[lightbox].description && <p className="text-[12px] text-white/70 mt-0.5">{gallery[lightbox].description}</p>}
          </div>
        )}
        {gallery.length > 1 && (
          <div className="overflow-x-auto pb-1">
            <div className="flex w-max mx-auto gap-2">
              {gallery.map((g, i) => (
                <button
                  key={`${g.id}-thumb-${i}`}
                  type="button"
                  onClick={() => setLightbox(i)}
                  className={`shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${i === lightbox ? 'border-[var(--c)] opacity-100' : 'border-transparent opacity-50 hover:opacity-90'}`}
                  aria-label={`Photo ${i + 1}`}
                >
                  <img src={g.url || g.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** Product details popup (image slider, price, full formatted description, Download / Enquire) */
export const ProductPopup: React.FC<SectionProps> = ({ t }) => {
  const { productPopup: p, setProductPopup, setImagePopup, productEnquiryUrl } = t;
  if (!p) return null;
  const name = p.name || p.title;
  const img = p.image || p.images?.[0];
  const price = formatPrice(p.price, p.currency);
  const descHtml = cleanRichHtml(p.description);
  return (
    <div role="dialog" aria-modal="true" aria-label={name} onClick={() => setProductPopup(null)} className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 tpl-fade-in">
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
          <h3 className="text-[15px] font-bold text-[#0B1B33] min-w-0">{name}</h3>
          <button type="button" onClick={() => setProductPopup(null)} className="w-8 h-8 shrink-0 rounded-full hover:bg-slate-100 flex items-center justify-center" aria-label="Close">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <div className="overflow-y-auto">
          {img && (
            <ProductImageSlider
              images={productImages(p)}
              alt={name}
              withControls
              onOpen={(src) => setImagePopup({ src, title: name })}
              className={`w-full bg-[var(--cs)] ${productImages(p).length > 1 ? 'h-[46vh]' : 'h-[40vh]'}`}
              imgClassName="cursor-zoom-in"
            />
          )}
          <div className="p-4">
            {price && <p className="mb-2 text-[16px] font-extrabold text-[#0B1B33]">{price}</p>}
            {descHtml ? (
              <div className={`text-[13px] leading-relaxed text-slate-700 ${RICH_TEXT_CLASS}`} dangerouslySetInnerHTML={{ __html: descHtml }} />
            ) : (
              <p className="text-[13px] text-slate-500">No description.</p>
            )}
          </div>
        </div>
        {(!(p.isHideEnquiry ?? p.hideEnquiry) || (img && !(p.isHideDownloadProductCart ?? p.hideDownload))) && (
          <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-200">
            {img && !(p.isHideDownloadProductCart ?? p.hideDownload) && (
              <button type="button" onClick={() => downloadImage(img, name)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--c)] text-[var(--c)] py-2.5 text-[13px] font-semibold hover:bg-[var(--cs)]">
                <Download className="w-4 h-4" /> Download
              </button>
            )}
            {!(p.isHideEnquiry ?? p.hideEnquiry) && (
              <a href={productEnquiryUrl(p.customEnquiryMessage)} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--c)] hover:bg-[var(--cd)] py-2.5 text-[13px] font-semibold text-white">
                <Mail className="w-4 h-4" /> Enquire
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/** Single product image, full screen */
export const ImagePopup: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, imagePopup, setImagePopup } = t;
  if (!imagePopup) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={() => setImagePopup(null)}
      className="fixed inset-0 z-[80] flex flex-col bg-black/90 backdrop-blur-sm text-white tpl-fade-in"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-[14px] font-semibold truncate">{imagePopup.title}</span>
        <button
          type="button"
          onClick={() => setImagePopup(null)}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className={`flex-1 min-h-0 flex items-center justify-center pb-6 ${isMobile ? 'px-3' : 'px-16'}`}>
        <img src={imagePopup.src} alt={imagePopup.title || ''} onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl tpl-fade-in" />
      </div>
    </div>
  );
};
