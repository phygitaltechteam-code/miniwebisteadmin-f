import { CARD_HOST_LABEL } from '@/utils/cardUrl';
import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, Maximize2 } from 'lucide-react';
import { ProfileData } from '../types/profile';
import { getPortalTheme, PortalThemeId } from '../types/theme';
import { TemplateWebsitePreview } from './TemplateWebsitePreview';

interface MobileSimulatorProps {
  profile: ProfileData;
  onOpenFullPreview: (mode?: 'mobile' | 'tablet' | 'desktop') => void;
  onToast: (msg: string) => void;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  profile,
  onOpenFullPreview,
  onToast,
}) => {
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  const themeId: PortalThemeId = (profile.theme as PortalThemeId) || 'navy-orange';
  const themeConfig = getPortalTheme(themeId);

  return (
    <div className="w-full">
      <div className="bg-white border border-[#c5c6cd]/60 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col items-center">
        {/* Simulator Header Controls */}
        <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-[#c5c6cd]/40">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-[#091426] truncate">
              Live Preview
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border shrink-0 ${themeConfig.previewClass}`}
              title={themeConfig.name}
            >
              {themeConfig.badge}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#f8f9fc] p-0.5 rounded-lg border border-stroke shrink-0">
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                deviceMode === 'mobile'
                  ? 'bg-white text-orange-600 shadow-2xs'
                  : 'text-gray-500 hover:text-[#091426]'
              }`}
              title="Mobile Frame"
            >
              <Smartphone className="w-3 h-3" />
              <span>Mobile</span>
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                deviceMode === 'tablet'
                  ? 'bg-white text-orange-600 shadow-2xs'
                  : 'text-gray-500 hover:text-[#091426]'
              }`}
              title="Tablet Frame"
            >
              <Tablet className="w-3 h-3" />
              <span>Tab</span>
            </button>
            <button
              onClick={() => {
                setDeviceMode('desktop');
                onOpenFullPreview('desktop');
              }}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                deviceMode === 'desktop'
                  ? 'bg-white text-orange-600 shadow-2xs'
                  : 'text-gray-500 hover:text-[#091426]'
              }`}
              title="Open full screen desktop preview"
            >
              <Monitor className="w-3 h-3" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => onOpenFullPreview(deviceMode)}
              className="p-1 rounded text-gray-400 hover:text-orange-600 hover:bg-white transition-colors"
              title="Expand whole screen preview"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Device Simulator Mockup */}
        <div
          className={`w-full transition-all duration-300 bg-slate-900 shadow-2xl border-4 border-slate-800 ${
            deviceMode === 'desktop'
              ? 'rounded-2xl p-2 max-w-[560px]'
              : deviceMode === 'tablet'
              ? 'rounded-[32px] p-2.5 max-w-[420px]'
              : 'rounded-[38px] p-2.5 sm:p-3 max-w-[340px]'
          }`}
        >
          {deviceMode === 'desktop' ? (
            /* Desktop Browser Header Bar with window controls & URL */
            <div className="w-full bg-slate-800 rounded-t-lg px-3 py-1.5 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="bg-slate-950/80 px-2.5 py-0.5 rounded text-[10px] font-mono text-slate-300 truncate max-w-[280px]">
                {CARD_HOST_LABEL}{profile.vanityUrl || 'business'}
              </div>
              <div className="w-8" />
            </div>
          ) : (
            /* Phone / Tablet Speaker Notch */
            <div className="w-24 h-3.5 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-950 mr-2" />
              <div className="w-6 h-1 bg-slate-700 rounded-full" />
            </div>
          )}

          {/* Digital Website Page Display inside Simulator Frame */}
          <div className="bg-white rounded-[24px] overflow-hidden flex flex-col h-[560px] custom-scroll overflow-y-auto relative">
            {/* Same website design as the public card page (/<display link>) */}
            <TemplateWebsitePreview profile={profile} themeId={themeId} viewMode={deviceMode} />
          </div>
        </div>

        {/* Real-time sync caption */}
        <p className="text-[10px] font-bold text-gray-400 mt-2 text-center tracking-tight">
          Live sync across all sections for {CARD_HOST_LABEL}{profile.vanityUrl || 'business'}
        </p>
      </div>
    </div>
  );
};

export default MobileSimulator;
