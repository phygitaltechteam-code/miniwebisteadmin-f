import React from 'react';
import { MessageCircle } from 'lucide-react';
import { PublicFeedback, FeedbackSummary } from '@/lib/api/publicFeedbackApi';
import { ProfileData } from '@/types/profile';
import { TEMPLATE_KEYFRAMES } from './palette';
import { useTemplateModel, ViewMode } from './useTemplateModel';
import { HeaderSection } from './sections/HeaderSection';
import { MobileProfileCard } from './sections/MobileProfileCard';
import { BannerCarousel } from './sections/BannerCarousel';
import { HeroSection } from './sections/HeroSection';
import { LinksSection } from './sections/LinksSection';
import { AboutSection } from './sections/AboutSection';
import { ProductsSection } from './sections/ProductsSection';
import { PaymentSection } from './sections/PaymentSection';
import { GallerySection, VideosSection } from './sections/MediaSections';
import { FormsRow } from './sections/FormsRow';
import { ShareSection } from './sections/ShareCard';
import { FooterSection } from './sections/FooterSection';
import { GalleryLightbox, ProductPopup, ImagePopup } from './sections/Popups';

export { TEMPLATE_PALETTES, paletteForTheme } from './palette';
export type { TemplatePaletteKey } from './palette';

/** Stable default so the reviews list is not reset on every render */
const NO_FEEDBACKS: PublicFeedback[] = [];

interface TemplateWebsitePreviewProps {
  profile: ProfileData;
  /** Card theme id; mapped to the orange / violet / blue / green palette */
  themeId?: string;
  viewMode?: ViewMode;
  /** Public page only: admin id / vanity URL the feedback form saves to (builder previews leave it out and send nothing) */
  feedbackTarget?: string;
  /** Saved reviews shown above the feedback form */
  initialFeedbacks?: PublicFeedback[];
  /** Average rating / count over all saved feedback */
  feedbackSummary?: FeedbackSummary | null;
}

/** The business website template: used by the builder previews and the public card page */
export const TemplateWebsitePreview: React.FC<TemplateWebsitePreviewProps> = ({ profile, themeId, viewMode = 'desktop', feedbackTarget, initialFeedbacks = NO_FEEDBACKS }) => {
  const t = useTemplateModel(profile, themeId, viewMode, feedbackTarget, initialFeedbacks);
  const { isMobile, pad, cssVars, rootRef, banners, show, shareInRow, whatsapp, whatsappUrl } = t;

  return (
    <div ref={rootRef} style={cssVars} className="w-full bg-[#F4F7FB] text-[#0B1B33] font-['Poppins','Roboto',Helvetica,Arial,sans-serif]">
      <style>{TEMPLATE_KEYFRAMES}</style>

      <HeaderSection t={t} />
      {isMobile && <MobileProfileCard t={t} />}
      {banners.length > 0 && <BannerCarousel t={t} />}
      {!isMobile && <HeroSection t={t} />}

      <main className={`${pad} py-6 flex flex-col gap-8 [&_[data-section]]:scroll-mt-16`}>
        {show.links && <LinksSection t={t} />}
        {show.about && <AboutSection t={t} />}
        {show.products && <ProductsSection t={t} />}
        {show.payment && <PaymentSection t={t} />}
        {show.gallery && <GallerySection t={t} />}
        {show.videos && <VideosSection t={t} />}
        {(show.enquiry || show.feedback) && <FormsRow t={t} />}
        {/* Desktop: Share sits in the forms row above */}
        {show.share && !shareInRow && <ShareSection t={t} />}
      </main>

      <FooterSection t={t} />

      <GalleryLightbox t={t} />
      <ProductPopup t={t} />
      <ImagePopup t={t} />

      {/* Floating WhatsApp button */}
      {whatsapp && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sticky bottom-4 float-right mr-4 -mt-14 w-12 h-12 rounded-full bg-[#25D366] text-white shadow-xl flex items-center justify-center z-20"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}
    </div>
  );
};

export default TemplateWebsitePreview;
