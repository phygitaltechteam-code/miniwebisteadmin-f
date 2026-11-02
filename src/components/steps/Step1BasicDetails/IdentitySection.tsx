import React from 'react';
import { CheckCircle2, Upload, Image as ImageIcon, Plus, Trash2, Building } from 'lucide-react';
import { CARD_HOST_LABEL } from '@/utils/cardUrl';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { Step1Model } from './useStep1Model';
import { CARD_CLASS, CardTitle } from './ui';

/** Company name, display link (with availability check) and tagline */
const NameAndLink: React.FC<{ m: Step1Model }> = ({ m }) => {
  const { profile, onChange, handleBusinessNameChange, checkingUrl, vanityResult, vanityError, handleCheckUrl } = m;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-3">
      <div>
        <GenericInputField
          label="Enter Company Name (Required)"
          value={profile.businessName}
          onChange={(e) => handleBusinessNameChange(e.target.value)}
          placeholder="e.g. ASSA O LIVING"
          required
        />
      </div>

      <div>
        <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
          Enter Display Link Name (Required) <span className="text-red-500 font-bold">*</span>
        </label>

        <div className="flex">
          <span className="h-9 px-2.5 text-[14px] font-mono text-gray-500 border border-r-0 border-[#C4C4C4] bg-gray-50 rounded-l flex items-center shrink-0">
            {CARD_HOST_LABEL}
          </span>
          <input
            type="text"
            value={profile.vanityUrl}
            onChange={(e) => onChange('vanityUrl', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className="flex-1 min-w-0 h-9 px-2.5 bg-white text-[14px] text-[#000000DE] font-mono border-y border-[#C4C4C4] focus:outline-none focus:border-[#2196F3]"
            placeholder="assa-o-living"
          />
          <button
            type="button"
            onClick={handleCheckUrl}
            disabled={checkingUrl}
            className="h-9 px-3 rounded-r bg-[#2196F3] text-white text-[14px] font-medium hover:bg-[#1E88E5] transition-colors shrink-0"
          >
            {checkingUrl ? 'Checking...' : 'Check'}
          </button>
        </div>
        {/* Result of the vanity-check API */}
        {vanityResult && !checkingUrl && (
          vanityResult.available ? (
            <p className="mt-1 text-[12px] text-emerald-600">✓ {CARD_HOST_LABEL}{vanityResult.vanityUrl} is available</p>
          ) : (
            <p className="mt-1 text-[12px] text-red-600">
              ✕ {CARD_HOST_LABEL}{vanityResult.vanityUrl} is already taken
              {vanityResult.suggestion && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => onChange('vanityUrl', vanityResult.suggestion as string)}
                    className="font-semibold text-[#2196F3] hover:underline"
                  >
                    Use {vanityResult.suggestion}
                  </button>
                </>
              )}
            </p>
          )
        )}
        {vanityError && !checkingUrl && <p className="mt-1 text-[12px] text-red-600">{vanityError}</p>}
      </div>

      <div>
        <GenericInputField
          label="Enter Business Tagline (Optional)"
          value={profile.tagline || profile.businessTagline || ''}
          onChange={(e) => {
            onChange('tagline', e.target.value);
            onChange('businessTagline', e.target.value);
          }}
          placeholder="e.g. Elevating Quality, Redefining Standards"
        />
      </div>
    </div>
  );
};

/** Logo upload with the optional logo border */
const LogoUpload: React.FC<{ m: Step1Model }> = ({ m }) => {
  const { profile, onChange, handleLogoUpload } = m;
  return (
    <div className="p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-white flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[14px] font-medium text-[#000000DE]">
          Upload Logo / Profile Pic
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-700 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(profile.hasGoldenBorder)}
            onChange={(e) => onChange('hasGoldenBorder', e.target.checked)}
            className="w-3.5 h-3.5 text-[#2196F3] rounded border-gray-300 focus:ring-[#2196F3]"
          />
          <span>Add logo border</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center p-1 relative overflow-hidden shrink-0 border ${
          profile.hasGoldenBorder ? 'border-amber-400 ring-2 ring-amber-300/40 shadow-xs' : 'border-[#E0E0E0]'
        }`}>
          {profile.logoUrl ? (
            <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <span className="font-bold text-[#2196F3] text-xs">LOGO</span>
          )}
        </div>

        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#C4C4C4] bg-white text-[#000000DE] text-[13px] font-medium hover:bg-gray-50 hover:border-[#2196F3] transition-colors">
          <Upload className="w-3.5 h-3.5 text-[#2196F3]" />
          <span>Choose Logo</span>
          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </label>
      </div>
    </div>
  );
};

/** Header banners: primary preview, thumbnails (set primary / remove) and upload (up to 8) */
const BannerUploads: React.FC<{ m: Step1Model }> = ({ m }) => {
  const { bannersList, handleBannerUpload, handleSetPrimaryBanner, handleRemoveBanner } = m;
  return (
    <div className="p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-white space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#2196F3]" />
          <label className="text-[14px] font-medium text-[#000000DE]">
            Header Banners (Multiple Supported)
          </label>
          <span className="text-[11px] font-bold text-[#2196F3] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
            {bannersList.length}/8
          </span>
        </div>
        <span className="text-[11px] text-[#757575] font-normal">
          Responsive: 16:9 Mobile • 21:9 Desktop • Recommended 1200×500 px
        </span>
      </div>

      {bannersList.length > 0 ? (
        <div className="space-y-2.5">
          {/* Primary Banner Large Responsive Display */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[3/1] max-h-52 sm:max-h-60 rounded-lg overflow-hidden border border-[#E0E0E0] bg-black shadow-2xs group select-none">
            <img src={bannersList[0]} alt="Primary Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

            {/* Badges */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-white text-[11px] font-medium backdrop-blur-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Primary Header Banner</span>
            </div>

            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#2196F3] text-white text-[11px] font-bold shadow-xs">
              Active
            </div>

            {/* Actions */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRemoveBanner(0)}
                className="p-1.5 rounded-lg bg-black/70 hover:bg-red-600 text-white transition-colors text-xs flex items-center gap-1"
                title="Delete this banner"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Remove</span>
              </button>
            </div>
          </div>

          {/* Additional Banners Thumbnails Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {bannersList.map((bannerUrl, idx) => {
              const isPrimary = idx === 0;
              return (
                <div
                  key={idx}
                  className={`relative aspect-[16/9] w-24 sm:w-28 rounded-md overflow-hidden border ${
                    isPrimary ? 'border-[#2196F3] ring-2 ring-[#2196F3]/30' : 'border-[#E0E0E0]'
                  } group bg-black shrink-0`}
                >
                  <img
                    src={bannerUrl}
                    alt={`Banner ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => !isPrimary && handleSetPrimaryBanner(bannerUrl)}
                  />
                  {isPrimary ? (
                    <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-[#2196F3] text-white text-[9px] font-bold">
                      Primary
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryBanner(bannerUrl)}
                      className="absolute inset-0 bg-black/60 text-white text-[10px] font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBanner(idx);
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                    title="Remove banner"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}

            {/* Upload More Banners Button */}
            {bannersList.length < 8 && (
              <label className="cursor-pointer aspect-[16/9] w-24 sm:w-28 rounded-md border border-dashed border-[#C4C4C4] hover:border-[#2196F3] bg-[#FAFAFA] hover:bg-[#EFF6FF] flex flex-col items-center justify-center text-center transition-colors shrink-0">
                <Plus className="w-4 h-4 text-[#2196F3] mb-0.5" />
                <span className="text-[10px] font-medium text-[#000000DE]">Add More</span>
                <input type="file" multiple accept="image/*" onChange={handleBannerUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>
      ) : (
        /* Empty state dropzone */
        <label className="cursor-pointer border border-dashed border-[#C4C4C4] hover:border-[#2196F3] rounded-lg p-5 flex flex-col items-center justify-center text-center bg-white hover:bg-[#EFF6FF]/30 transition-all w-full group">
          <ImageIcon className="w-8 h-8 text-[#2196F3] mb-1.5 group-hover:scale-105 transition-transform" />
          <span className="text-[14px] font-medium text-[#000000DE]">
            Click or Drag to Upload Multiple Header Banners
          </span>
          <span className="text-[12px] text-[#757575] mt-1">
            Auto-responsive: 16:9 on Mobile • 21:9 on Desktop. Recommended: 1200 × 500 px.
          </span>
          <input type="file" multiple accept="image/*" onChange={handleBannerUpload} className="hidden" />
        </label>
      )}
    </div>
  );
};

/** 1. Business Name & Identity: name, display link, tagline, logo and banners */
export const IdentitySection: React.FC<{ m: Step1Model }> = ({ m }) => (
  <div className={CARD_CLASS}>
    <CardTitle icon={<Building className="w-3.5 h-3.5 text-[#2196F3]" />}>Business Name & Identity</CardTitle>
    <NameAndLink m={m} />
    <div className="space-y-3 pt-2.5 border-t border-[#E0E0E0]">
      <LogoUpload m={m} />
      <BannerUploads m={m} />
    </div>
  </div>
);
