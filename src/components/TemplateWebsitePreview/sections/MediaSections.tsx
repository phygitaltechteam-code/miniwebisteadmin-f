import React from 'react';
import { Play, ZoomIn } from 'lucide-react';
import { SectionProps } from '../useTemplateModel';
import { SectionTitle } from '../SectionTitle';
import { youtubeId, titleParts } from '../helpers';

/** Photo Gallery (every photo; click opens the lightbox) */
export const GallerySection: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, isTablet, headings, gallery, sectionRank, setLightbox } = t;
  return (
    <section data-section="gallery" style={{ order: sectionRank('gallery') }}>
      <SectionTitle isMobile={isMobile} {...titleParts(headings.galleryHeading, 'Photo Gallery')} />
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${isMobile ? 3 : isTablet ? 4 : 5}, minmax(0, 1fr))` }}>
        {gallery.map((g, idx) => (
          <button
            key={`${g.id}-${idx}`}
            type="button"
            onClick={() => setLightbox(idx)}
            aria-label={g.title || `Open photo ${idx + 1}`}
            className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md text-left tpl-fade-in"
          >
            <img src={g.url || g.image} alt={g.title || ''} className="w-full aspect-[4/3] object-contain bg-[var(--cs)]" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-[#0B1B33] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-3.5 h-3.5" />
            </span>
            {g.title && (
              <span className="absolute bottom-0 inset-x-0 px-2.5 py-1.5 text-[11px] font-semibold text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {g.title}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
};

/** YouTube Videos (every video) */
export const VideosSection: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, isTablet, headings, videos, sectionRank } = t;
  return (
    <section data-section="videos" style={{ order: sectionRank('youtube') }}>
      <SectionTitle isMobile={isMobile} {...titleParts(headings.youtubeVideosHeading, 'YouTube Videos')} />
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${isMobile ? 2 : isTablet ? 3 : 4}, minmax(0, 1fr))` }}>
        {videos.map((v) => {
          const id = v.videoId || youtubeId(v.url || v.videoUrl || v.embedUrl);
          const thumb = v.thumbnailUrl || (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '');
          return (
            <a key={v.id} href={v.url || v.videoUrl || '#'} target="_blank" rel="noopener noreferrer" className="group block">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800">
                {thumb && <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-10 h-7 rounded-lg bg-[#FF0000] flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </span>
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[#0B1B33] line-clamp-1">{v.title}</p>
            </a>
          );
        })}
      </div>
    </section>
  );
};
