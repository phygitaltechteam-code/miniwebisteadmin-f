import React, { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage } from '@/utils/imageCompressor';

export interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkKey: string;
  defaultName: string;
  defaultDescription: string;
  currentValue?: string;
  currentDescription?: string;
  currentIcon?: string;
  currentName?: string;
  /** Return false (or throw) to keep the popup open, e.g. when the API call fails */
  onSave: (data: { name: string; description: string; url: string; icon?: string }) => void | boolean | Promise<void | boolean>;
}

export const AddLinkModal: React.FC<AddLinkModalProps> = ({
  isOpen,
  onClose,
  linkKey,
  defaultName,
  defaultDescription,
  currentValue = '',
  currentDescription = '',
  currentIcon = '',
  currentName,
  onSave,
}) => {
  // Only the custom link lets the user set its own logo and name
  const isCustom = linkKey === 'customLink';
  const [linkUrl, setLinkUrl] = useState(currentValue);
  const [linkName, setLinkName] = useState(currentName || defaultName);
  const [iconUrl, setIconUrl] = useState(currentIcon);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLinkUrl(currentValue);
      setLinkName(currentName || defaultName);
      setIconUrl(currentIcon);
    }
  }, [isOpen, currentValue, currentName, defaultName, currentIcon]);

  if (!isOpen) return null;

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setIconUrl(await compressImage(file, 200, 200, 0.85));
    } catch {
      setIconUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    let url = linkUrl.trim();
    const name = (isCustom ? linkName.trim() : '') || defaultName;
    if (!url) {
      toast.error('Please enter a link.');
      return;
    }

    if (isCustom) {
      // Backend validates customLink as a URL: add https:// when missing, then check it has a real domain
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      let isValid = false;
      try {
        isValid = new URL(url).hostname.includes('.');
      } catch {
        isValid = false;
      }
      if (!isValid) {
        toast.error('Please enter a valid link, e.g. https://example.com');
        return;
      }
      setLinkUrl(url);
    }

    // Description (and, for non-custom links, name and icon) are not editable here; pass existing values through
    setIsSaving(true);
    try {
      const result = await onSave({
        name,
        description: currentDescription || defaultDescription,
        url,
        icon: isCustom ? iconUrl : currentIcon,
      });
      if (result !== false) onClose();
    } catch {
      // Caller already reported the error; keep the popup open so the user can fix it
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 text-sm font-medium text-[#212121] placeholder:text-gray-400 bg-transparent focus:outline-none';
  const boxClass =
    'relative rounded border border-gray-300 bg-white focus-within:border-[#2196F3] focus-within:ring-1 focus-within:ring-[#2196F3] transition-all';
  const floatLabelClass = 'absolute -top-2.5 left-2.5 px-1 bg-white text-[11px] font-medium text-gray-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Roboto',Helvetica,Arial,sans-serif] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[520px] rounded-lg bg-white p-5 sm:p-6 shadow-2xl relative flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-[20px] font-bold text-[#212121]">
            {isCustom ? 'Add Custom Link' : `${defaultName} Link`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCustom && (
          <>
            {/* Upload Logo */}
            <div>
              <label className="block text-sm font-semibold text-[#212121] mb-2">Logo</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-24 rounded-md border-2 border-dashed border-[#90caf9] bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 transition-colors p-2 text-center group"
              >
                {iconUrl ? (
                  <>
                    <img src={iconUrl} alt="Link logo" className="w-12 h-12 object-contain rounded" />
                    <span className="text-[10px] text-gray-400 group-hover:text-[#2196F3] mt-1 font-medium">
                      Change Logo
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-[#212121] mb-1.5 stroke-[1.75]" />
                    <span className="text-xs font-semibold text-[#2196F3]">Upload Logo</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Link Name */}
            <div className="relative pt-1.5">
              <div className={boxClass}>
                <span className={floatLabelClass}>Enter Link Name</span>
                <input
                  type="text"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder="e.g. My Portfolio"
                  className={inputClass}
                />
              </div>
            </div>
          </>
        )}

        {/* Paste Link */}
        <div className="relative pt-1.5">
          <div className={boxClass}>
            <span className={floatLabelClass}>{isCustom ? 'Enter your custom link' : 'Enter Link'}</span>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              placeholder="Paste Link"
              autoFocus={!isCustom}
              className={inputClass}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#2196F3] hover:bg-blue-50/70 rounded transition-colors uppercase tracking-wider"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 text-xs font-bold bg-[#2196F3] hover:bg-[#1E88E5] text-white rounded shadow-sm hover:shadow transition-all uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? 'SAVING...' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLinkModal;
