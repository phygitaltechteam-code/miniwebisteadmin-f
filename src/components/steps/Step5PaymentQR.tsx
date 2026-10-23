import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  CreditCard, QrCode, Upload, ArrowRight, 
  ArrowLeft, Eye, EyeOff, CheckCircle2, Building,
  Download, Sparkles, Smartphone, ShieldCheck, Loader2
} from 'lucide-react';
import { ProfileData } from '../../types/profile';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { step5PaymentQRSchema } from '@/schemas/cardProfileSchema';
import { 
  getCustomerPayment, 
  saveOrUpdateCustomerPayment,
  parseCustomerPaymentResponse
} from '@/lib/api/customerPaymentApi';

interface Step5Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

export const Step5PaymentQR: React.FC<Step5Props> = ({
  profile,
  onChange,
  onNext,
  onPrev,
  onToast,
  adminId,
}) => {
  const [showAccountNo, setShowAccountNo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fetch existing payment info on mount (GET customers/payment or superAdmin/admin/:adminId/payment)
  useEffect(() => {
    let isMounted = true;
    const loadPayment = async () => {
      try {
        const res = await getCustomerPayment(adminId);
        const parsed = parseCustomerPaymentResponse(res);
        if (!isMounted) return;

        if (parsed.upiId) onChange('upiId', parsed.upiId);
        if (parsed.paymentPhoneNo || parsed.upiNumber) {
          const phone = parsed.paymentPhoneNo || parsed.upiNumber || '';
          onChange('paymentPhoneNo', phone);
          onChange('upiNumber', phone);
        }
        if (parsed.bankName) onChange('bankName', parsed.bankName);
        if (parsed.bankHolderName || parsed.accountHolderName) {
          const holder = parsed.bankHolderName || parsed.accountHolderName || '';
          onChange('bankHolderName', holder);
          onChange('accountHolderName', holder);
        }
        if (parsed.bankAccountNumber || parsed.accountNumber) {
          const accNo = parsed.bankAccountNumber || parsed.accountNumber || '';
          onChange('bankAccountNumber', accNo);
          onChange('accountNumber', accNo);
        }
        if (parsed.bankIfscCode || parsed.ifscCode) {
          const ifsc = parsed.bankIfscCode || parsed.ifscCode || '';
          onChange('bankIfscCode', ifsc);
          onChange('ifscCode', ifsc);
        }
        if (parsed.accountType) {
          onChange('accountType', parsed.accountType);
        }
      } catch (err) {
        // Normal if payment details are not yet configured
      }
    };
    loadPayment();
    return () => { isMounted = false; };
  }, [adminId]);

  // Dynamic UPI string
  const upiId = profile.upiId || '9225812831@ybl';
  const upiPayPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(profile.businessName || 'Merchant')}&cu=INR`;
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiPayPayload)}`;

  const handleDownloadQr = async () => {
    try {
      onToast('Downloading dynamic UPI QR Code image...');
      const response = await fetch(dynamicQrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${profile.vanityUrl || 'business'}-upi-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('UPI QR Code downloaded directly to your device!');
    } catch {
      // Fallback
      const link = document.createElement('a');
      link.href = dynamicQrUrl;
      link.download = `${profile.vanityUrl || 'business'}-upi-qr.png`;
      link.target = '_blank';
      link.click();
    }
  };

  const handleSaveAndNext = async () => {
    // 1. Pre-validate IFSC code if provided
    const enteredIfsc = (profile.bankIfscCode || profile.ifscCode || '').trim().toUpperCase();
    if (enteredIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(enteredIfsc)) {
      const ifscErr = 'Invalid IFSC code (e.g. HDFC0001234) — must be 11 characters: 4 letters, 0, followed by 6 alphanumeric characters.';
      toast.error(ifscErr, { id: 'save-step5' });
      onToast(`⚠️ ${ifscErr}`);
      return;
    }

    const result = step5PaymentQRSchema.safeParse({
      upiId: profile.upiId || '',
      paymentPhoneNo: profile.paymentPhoneNo || profile.upiNumber || '',
      upiNumber: profile.upiNumber || profile.paymentPhoneNo || '',
      bankName: profile.bankName || '',
      bankHolderName: profile.bankHolderName || profile.accountHolderName || '',
      accountHolderName: profile.accountHolderName || profile.bankHolderName || '',
      bankAccountNumber: profile.bankAccountNumber || profile.accountNumber || '',
      accountNumber: profile.accountNumber || profile.bankAccountNumber || '',
      bankIfscCode: enteredIfsc || null,
      ifscCode: enteredIfsc || null,
      accountType: profile.accountType || 'Savings Account',
    });

    if (!result.success) {
      const msg = result.error.errors[0]?.message || 'Please check payment parameters';
      toast.error(`Validation: ${msg}`, { id: 'save-step5' });
      onToast(`⚠️ Validation: ${msg}`);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Syncing payment coordinates to customers/payment API...');
    onToast('Submitting payment & UPI details to server...');

    try {
      const res = await saveOrUpdateCustomerPayment(profile, adminId);
      const serverMsg = res?.message || 'Step 5: Payment details saved successfully!';
      const displayMsg = `${serverMsg} (customers/payment)`;

      toast.success(displayMsg, { id: toastId, duration: 4000 });
      onToast(`✅ ${displayMsg}`);
      onNext();
    } catch (error: any) {
      console.error('[Step5PaymentQR] API Error on customers/payment:', error);
      const backendErrors = error?.response?.data?.errors;
      let fieldError = '';
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        fieldError = backendErrors
          .map((e: any) => `${e.field ? e.field + ': ' : ''}${e.message}`)
          .join(', ');
      }
      const backendMessage =
        fieldError ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to sync payment methods to customers/payment API.';
      const statusCode = error?.response?.status ? ` [HTTP ${error.response.status}]` : '';

      const errText = `API Error${statusCode}: ${backendMessage}`;
      toast.error(errText, { id: toastId, duration: 5000 });
      onToast(`❌ ${errText}`);

      // Do NOT proceed to next step if it was a 400 Validation Error
      if (error?.response?.status !== 400) {
        onNext();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white border border-[#c5c6cd]/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs scroll-mt-28" id="sec-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#c5c6cd]/40 mb-3.5 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
            5
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
            Payment Methods & Dynamic UPI QR
          </h2>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* ─── Dynamic UPI Address & Live Generated QR ─────────────── */}
        <div className="p-3 sm:p-5 rounded-2xl border border-blue-200 bg-[#f8faff]">
          <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-ping" />
            <h3 className="text-xs font-bold text-[#091426] uppercase tracking-wider">
              Automatic Dynamic UPI QR Generator
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Input Coordinates */}
            <div className="lg:col-span-7 space-y-3">
              <GenericInputField
                label="UPI ID /UPI Address"
                value={profile.upiId || ''}
                onChange={(e) => onChange('upiId', e.target.value.trim().toLowerCase())}
                placeholder="e.g. 9225812831@ybl or company@sbi"
                prefix={<Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />}
                required
              />

              <GenericInputField
                label="UPI Registered Phone Number"
                value={profile.paymentPhoneNo || profile.upiNumber || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange('paymentPhoneNo', val);
                  onChange('upiNumber', val);
                }}
                placeholder="e.g. +91 9225812831"
                prefix={<Smartphone className="w-3.5 h-3.5 text-[#2563EB]" />}
              />

            
            </div>

            {/* Live Generated QR Code Card */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-stroke shadow-xs text-center">
              <div className="w-36 h-36 p-2 rounded-xl border-2 border-dashed border-[#2563EB]/60 bg-white flex items-center justify-center relative mb-2">
                <img
                  src={dynamicQrUrl}
                  alt="Dynamic UPI QR Code"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>

              <span className="text-xs font-bold text-[#091426]">
                {profile.businessName || 'Business UPI QR'}
              </span>
              <span className="text-[11px] font-mono text-[#2563EB] font-bold">
                {upiId}
              </span>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-xs font-bold border border-[#BFDBFE] hover:bg-[#2563EB] hover:text-white transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download QR Image</span>
              </button>
            </div>
          </div>
        </div>



        {/* ─── Institutional Bank Account Details ─────────────────── */}
        <div className="pt-3 border-t border-stroke">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-3">
            Institutional Bank Account Coordinates
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <GenericInputField
              label="Bank Name"
              value={profile.bankName || ''}
              onChange={(e) => onChange('bankName', e.target.value)}
              placeholder="e.g. State Bank of India"
            />

            <GenericInputField
              label="Account Holder Name"
              value={profile.bankHolderName || profile.accountHolderName || ''}
              onChange={(e) => {
                const val = e.target.value;
                onChange('bankHolderName', val);
                onChange('accountHolderName', val);
              }}
              placeholder="e.g. Maratha Entrepreneur Association"
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">Account Number</label>
                <button
                  type="button"
                  onClick={() => setShowAccountNo(!showAccountNo)}
                  className="text-[11px] text-[#2563EB] hover:underline font-bold"
                >
                  {showAccountNo ? 'Hide' : 'Reveal'}
                </button>
              </div>
              <GenericInputField
                type={showAccountNo ? 'text' : 'password'}
                value={profile.bankAccountNumber || profile.accountNumber || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange('bankAccountNumber', val);
                  onChange('accountNumber', val);
                }}
                placeholder="Account number"
              />
            </div>

            <div>
              <GenericInputField
                label="IFSC Code"
                value={profile.bankIfscCode || profile.ifscCode || ''}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                  onChange('bankIfscCode', val);
                  onChange('ifscCode', val);
                }}
                placeholder="e.g. HDFC0001234 or SBIN0001244"
                maxLength={11}
              />
              {(() => {
                const ifsc = (profile.bankIfscCode || profile.ifscCode || '').trim().toUpperCase();
                if (!ifsc) return null;
                const isValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
                if (isValid) {
                  return (
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      ✓ Valid IFSC Code format ({ifsc.length}/11)
                    </span>
                  );
                }
                return (
                  <span className="text-[10px] text-amber-600 font-medium mt-1 block">
                    Must be 11 characters: 4 letters + 0 + 6 letters/digits (current: {ifsc.length}/11)
                  </span>
                );
              })()}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Account Type
              </label>
              <select
                value={profile.accountType || 'Savings Account'}
                onChange={(e) => onChange('accountType', e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-stroke bg-white text-xs font-medium focus:border-[#2563EB] focus:outline-none"
              >
                <option value="Savings Account">Savings Account</option>
                <option value="Current Account">Current Account</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation Buttons */}
      <div className="mt-5 pt-4 sm:mt-8 sm:pt-5 border-t border-[#c5c6cd]/40 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-stroke bg-white text-[#091426] text-xs font-semibold hover:bg-[#f8f9ff] flex items-center gap-1.5 sm:gap-2 transition-all shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Previous: Links & Social</span>
          <span className="sm:hidden">Previous</span>
        </button>

        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="!px-6 !py-2.5 !text-xs !font-bold flex items-center gap-2 shadow-md shadow-[#2563EB]/25 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Payment Details...</span>
            </>
          ) : (
            <>
              <span>Save & Next</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </GenericButton>
      </div>
    </section>
  );
};
