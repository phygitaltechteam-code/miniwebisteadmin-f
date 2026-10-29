import React, { useEffect, useState } from 'react';
import { Loader2, SearchX } from 'lucide-react';
import { TemplateWebsitePreview } from '@/components/TemplateWebsitePreview';
import { getPublicCard, publicCardToProfile } from '@/lib/api/publicCardApi';
import { ProfileData } from '@/types/profile';

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
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    let alive = true;
    setState('loading');
    getPublicCard(vanityUrl)
      .then((card) => {
        if (!alive) return;
        const data = publicCardToProfile(card);
        setProfile(data);
        setState('ready');
        if (data.businessName) document.title = data.businessName;
      })
      .catch((error) => {
        if (!alive) return;
        setState(error?.response?.status === 404 ? 'missing' : 'error');
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
          {state === 'missing' ? 'Card not available' : 'Something went wrong'}
        </h1>
        <p className="max-w-sm text-[14px] text-slate-500">
          {state === 'missing'
            ? 'This digital card does not exist or is no longer active.'
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
      <TemplateWebsitePreview profile={profile} themeId={profile.theme} viewMode={viewMode} />
    </div>
  );
};

export default PublicCardPage;
