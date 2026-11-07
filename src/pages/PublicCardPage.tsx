import React, { useEffect, useState } from 'react';
import { Loader2, SearchX } from 'lucide-react';
import { TemplateWebsitePreview } from '@/components/TemplateWebsitePreview';
import { getPublicCard, publicCardToProfile } from '@/lib/api/publicCardApi';
import { feedbacksFromCard, feedbackSummaryFromCard, FeedbackSummary, PublicFeedback } from '@/lib/api/publicFeedbackApi';
import { ProfileData } from '@/types/profile';
import { recordCardVisit } from '@/lib/api/visitsApi';

/** Cards already counted in this page load (StrictMode runs effects twice) */
const visitSent = new Set<string>();

/** Where the guest came from, e.g. /<slug>?source=qr */
const visitSource = () => {
  try {
    const p = new URLSearchParams(window.location.search);
    return (p.get('source') || p.get('src') || p.get('utm_source') || '').slice(0, 40) || undefined;
  } catch {
    return undefined;
  }
};

/** Phone layout below this width, desktop layout above */
const MOBILE_MAX_WIDTH = 768;

const useViewMode = () => {
  const pick = () => (window.innerWidth < MOBILE_MAX_WIDTH ? 'mobile' : 'desktop') as 'mobile' | 'desktop';
  const [mode, setMode] = useState(pick);
  useEffect(() => {
    const onResize = () => setMode(pick());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return mode;
};

/**
 * Public website of one business at /<display link> (no login).
 * Shows only the website template, filled from GET client/card/:vanityUrl.
 */
export const PublicCardPage: React.FC<{ vanityUrl: string }> = ({ vanityUrl }) => {
  const viewMode = useViewMode();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [feedbacks, setFeedbacks] = useState<PublicFeedback[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  // Enquiry / feedback forms save to this card (admin id, else the display link)
  const [cardId, setCardId] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'expired' | 'error'>('loading');
  const [expiredOn, setExpiredOn] = useState('');

  useEffect(() => {
    let alive = true;
    setState('loading');
    getPublicCard(vanityUrl)
      .then((card) => {
        if (!alive) return;
        const data = publicCardToProfile(card);
        setProfile(data);
        setFeedbacks(feedbacksFromCard(card));
        setFeedbackSummary(feedbackSummaryFromCard(card));
        setCardId(String((card as any)?.id || (card as any)?.adminId || ''));
        setState('ready');
        if (data.businessName) document.title = data.businessName;
        // Count this guest visit once (the backend skips repeats within 30 minutes); never blocks the page
        const visitTarget = String((card as any)?.id || (card as any)?.adminId || vanityUrl);
        if (!visitSent.has(visitTarget)) {
          visitSent.add(visitTarget);
          recordCardVisit(visitTarget, visitSource()).catch(() => {});
        }
      })
      .catch((error) => {
        if (!alive) return;
        const status = error?.response?.status;
        // 403 CARD_EXPIRED: the business plan has expired
        const info = error?.response?.data?.data;
        const expired = status === 403 && info?.code === 'CARD_EXPIRED';
        if (expired && info?.expiryDate) {
          const d = new Date(info.expiryDate);
          if (!isNaN(d.getTime())) setExpiredOn(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
        }
        setState(status === 404 ? 'missing' : expired ? 'expired' : 'error');
      });
    return () => {
      alive = false;
    };
  }, [vanityUrl]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB] text-slate-500 gap-2 text-[14px]">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (state !== 'ready' || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F4F7FB] px-6 text-center font-['Roboto',Helvetica,Arial,sans-serif]">
        <SearchX className="w-12 h-12 text-slate-400" />
        <h1 className="text-[20px] font-bold text-[#0B1B33]">
          {state === 'missing' ? 'Card not available' : state === 'expired' ? 'This digital card has expired' : 'Something went wrong'}
        </h1>
        <p className="max-w-sm text-[14px] text-slate-500">
          {state === 'missing'
            ? 'This digital card does not exist or is no longer active.'
            : state === 'expired'
              ? `${expiredOn ? `The plan for this card ended on ${expiredOn}. ` : ''}This business card is not active right now. Please contact the business directly.`
              : 'The card could not be loaded. Please check your connection and try again.'}
        </p>
        {state === 'error' && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-1 rounded-lg bg-[#2196F3] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#1E88E5]"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <TemplateWebsitePreview profile={profile} themeId={profile.theme} viewMode={viewMode} feedbackTarget={cardId || vanityUrl} initialFeedbacks={feedbacks} feedbackSummary={feedbackSummary} />
    </div>
  );
};

export default PublicCardPage;
