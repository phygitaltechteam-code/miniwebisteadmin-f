import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface CopyBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: {
    id: string;
    fullname?: string;
    phoneNumber?: string;
  } | null;
  onCopySuccess?: (copiedBusiness: any) => void;
}

export const CopyBusinessModal: React.FC<CopyBusinessModalProps> = ({
  isOpen,
  onClose,
  business,
  onCopySuccess,
}) => {
  const [useSamePhone, setUseSamePhone] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copyDigitalCard, setCopyDigitalCard] = useState(true);
  const [copyViews, setCopyViews] = useState(false);
  const [copyFeedbacks, setCopyFeedbacks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (business) {
      setPhoneNumber(business.phoneNumber || '9930000993');
      setUseSamePhone(true);
      setCopyDigitalCard(true);
      setCopyViews(false);
      setCopyFeedbacks(false);
    }
  }, [business]);

  if (!isOpen || !business) return null;

  const handleCopy = () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(`Business card for "${business.fullname || 'Business'}" copied successfully!`);
      onCopySuccess?.({
        ...business,
        id: `${business.id}_copy_${Date.now()}`,
        fullname: `${business.fullname || 'Business'} (Copy)`,
        phoneNumber,
      });
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Roboto',Helvetica,Arial,sans-serif]">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-[18px] font-medium text-[#212121]">Copy Business:</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-2 space-y-4">
          <p className="text-[14px] text-gray-700">
            Register Customer'sPhone Number
          </p>

          <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
            <input
              type="checkbox"
              checked={useSamePhone}
              onChange={(e) => {
                setUseSamePhone(e.target.checked);
                if (e.target.checked && business.phoneNumber) {
                  setPhoneNumber(business.phoneNumber);
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-[#2196F3] focus:ring-[#2196F3]"
            />
            <span>Use Same Registered Phone Number</span>
          </label>

          {/* Outlined Phone Input with floating label */}
          <div className="relative mt-2">
            <input
              type="tel"
              id="copy-phone-number"
              value={phoneNumber}
              disabled={useSamePhone}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder=" "
              className="peer w-full rounded border border-gray-300 bg-white px-3.5 pt-3.5 pb-2 text-[14px] text-gray-900 focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3] disabled:bg-gray-50 disabled:text-gray-600"
            />
            <label
              htmlFor="copy-phone-number"
              className="absolute left-3 top-1 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-[11px] peer-focus:text-[#2196F3]"
            >
              Phone Number
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
            <input
              type="checkbox"
              checked={copyDigitalCard}
              onChange={(e) => setCopyDigitalCard(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#2196F3] focus:ring-[#2196F3]"
            />
            <span>Should copy digital card of this business?</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
            <input
              type="checkbox"
              checked={copyViews}
              onChange={(e) => setCopyViews(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#2196F3] focus:ring-[#2196F3]"
            />
            <span>Should copy views of digital card?</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
            <input
              type="checkbox"
              checked={copyFeedbacks}
              onChange={(e) => setCopyFeedbacks(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#2196F3] focus:ring-[#2196F3]"
            />
            <span>Should copy feedbacks of digital card?</span>
          </label>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCopy}
            className="text-[14px] font-bold text-[#2196F3] hover:text-[#1976D2] uppercase tracking-wide px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'COPYING...' : 'COPY CARD'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopyBusinessModal;
