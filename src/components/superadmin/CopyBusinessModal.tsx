import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { copyAdmin } from '@/lib/api/superadmin/admin';

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
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copyDigitalCard, setCopyDigitalCard] = useState(true);
  const [copyViews, setCopyViews] = useState(false);
  const [copyFeedbacks, setCopyFeedbacks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (business) {
      setName(business.fullname ? `${business.fullname} (Copy)` : '');
      setPhoneNumber(business.phoneNumber || '');
      setPassword('');
      setShowPassword(false);
      setCopyDigitalCard(true);
      setCopyViews(false);
      setCopyFeedbacks(false);
    }
  }, [business]);

  if (!isOpen || !business) return null;

  const handleCopy = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      // Creates a new business from the form and copies this one's data onto it (the original is unchanged)
      const result = await copyAdmin(business.id, {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        copyCard: copyDigitalCard,
        copyViews,
        copyFeedbacks,
      });
      toast.success(`"${name.trim()}" created as a copy of "${business.fullname || 'Business'}". Select a plan for it.`);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      onCopySuccess?.(result?.admin ?? result);
      onClose();
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message;
      toast.error(
        status === 409
          ? 'This phone number is already registered'
          : message || 'Failed to copy business',
      );
    } finally {
      setIsSubmitting(false);
    }
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
          {/* Name of the new business */}
          <div className="relative">
            <input
              type="text"
              id="copy-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
              className="peer w-full rounded border border-gray-300 bg-white px-3.5 pt-3.5 pb-2 text-[14px] text-gray-900 focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
            />
            <label
              htmlFor="copy-name"
              className="absolute left-3 top-1 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-[11px] peer-focus:text-[#2196F3]"
            >
              Name *
            </label>
          </div>

          <p className="text-[14px] text-gray-700">
            Register Customer's Phone Number
          </p>

          {/* Outlined Phone Input with floating label */}
          <div className="relative mt-2">
            <input
              type="tel"
              id="copy-phone-number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder=" "
              className="peer w-full rounded border border-gray-300 bg-white px-3.5 pt-3.5 pb-2 text-[14px] text-gray-900 focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3] disabled:bg-gray-50 disabled:text-gray-600"
            />
            <label
              htmlFor="copy-phone-number"
              className="absolute left-3 top-1 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-[11px] peer-focus:text-[#2196F3]"
            >
              Phone Number *
            </label>
          </div>

          {/* Login password for the new business */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="copy-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              autoComplete="new-password"
              className="peer w-full rounded border border-gray-300 bg-white pl-3.5 pr-10 pt-3.5 pb-2 text-[14px] text-gray-900 focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
            />
            <label
              htmlFor="copy-password"
              className="absolute left-3 top-1 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-[11px] peer-focus:text-[#2196F3]"
            >
              Password *
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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
