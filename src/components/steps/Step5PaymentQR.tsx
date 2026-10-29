import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  CreditCard, QrCode, Upload, ArrowRight, 
  ArrowLeft, Eye, EyeOff, CheckCircle2, Building,
  Loader2, Trash2, Image as ImageIcon,
  Wallet
} from 'lucide-react';
import { ProfileData } from '../../types/profile';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { step5PaymentQRSchema } from '@/schemas/cardProfileSchema';
import { 
  getCustomerPayment, 
  saveOrUpdateCustomerPayment,
  parseCustomerPaymentResponse,
  setWalletVisibility,
} from '@/lib/api/customerPaymentApi';
import { compressImage } from '@/utils/imageCompressor';

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

  const paytmFileRef = useRef<HTMLInputElement | null>(null);
  const phonePeFileRef = useRef<HTMLInputElement | null>(null);
  const gPayFileRef = useRef<HTMLInputElement | null>(null);

  // Auto-fetch existing payment info on mount (GET customers/payment or superAdmin/admin/:adminId/payment)
  useEffect(() => {
    let isMounted = true;
    const loadPayment = async () => {
      try {
        const res = await getCustomerPayment(adminId);
        const parsed = parseCustomerPaymentResponse(res);
        if (!isMounted) return;

        if (parsed.upiId) onChange('upiId', parsed.upiId);
        if (parsed.paytmPhone) onChange('paytmPhone', parsed.paytmPhone);
        if (parsed.phonePePhone) onChange('phonePePhone', parsed.phonePePhone);
        if (parsed.gPayPhone) onChange('gPayPhone', parsed.gPayPhone);
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
        if (parsed.paytmQrUrl) onChange('paytmQrUrl', parsed.paytmQrUrl);
        if (parsed.phonePeQrUrl) onChange('phonePeQrUrl', parsed.phonePeQrUrl);
        if (parsed.gPayQrUrl) onChange('gPayQrUrl', parsed.gPayQrUrl);
        if (parsed.paytmQrProviderName) onChange('paytmQrProviderName', parsed.paytmQrProviderName);
        if (parsed.phonePeQrProviderName) onChange('phonePeQrProviderName', parsed.phonePeQrProviderName);
        if (parsed.gPayQrProviderName) onChange('gPayQrProviderName', parsed.gPayQrProviderName);
        // Saved wallet ids + "Show on card" state (wallet isVisible)
        if (parsed.walletIds) onChange('walletIds', parsed.walletIds);
        if (parsed.hiddenPayments) onChange('hiddenPayments', parsed.hiddenPayments);
      } catch (err) {
        // Normal if payment details are not yet configured
      }
    };
    loadPayment();
    return () => { isMounted = false; };
  }, [adminId]);

  // Handle QR image file upload with compression
  const handleQrUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    urlKey: 'paytmQrUrl' | 'phonePeQrUrl' | 'gPayQrUrl',
    uploadedKey: 'paytmQrUploaded' | 'phonePeQrUploaded' | 'gPayQrUploaded',
    providerTitle: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 800, 0.9);
      onChange(urlKey, compressed);
      onChange(uploadedKey, true);
      toast.success(`${providerTitle} QR image uploaded successfully!`);
      onToast(`Uploaded ${providerTitle} QR image`);
    } catch {
      const fallbackUrl = URL.createObjectURL(file);
      onChange(urlKey, fallbackUrl);
      onChange(uploadedKey, true);
      toast.success(`${providerTitle} QR image uploaded!`);
      onToast(`Uploaded ${providerTitle} QR image`);
    }
  };

  const handleRemoveQr = (
    urlKey: 'paytmQrUrl' | 'phonePeQrUrl' | 'gPayQrUrl',
    uploadedKey: 'paytmQrUploaded' | 'phonePeQrUploaded' | 'gPayQrUploaded',
    providerTitle: string
  ) => {
    onChange(urlKey, '');
    onChange(uploadedKey, false);
    toast.success(`${providerTitle} QR image removed`);
    onToast(`Removed ${providerTitle} QR image`);
  };

  const renderWalletPhoneInput = (
    key: 'paytmPhone' | 'phonePePhone' | 'gPayPhone',
    label: string
  ) => (
    <div>
      <label className="block text-[13px] sm:text-[14px] font-normal text-[#000000DE] mb-1 truncate">
        {label}
      </label>
      <div className="flex">
        <span className="inline-flex items-center px-2.5 h-9 rounded-l border border-r-0 border-[#C4C4C4] bg-gray-50 text-[13px] sm:text-[14px] font-medium text-gray-700 select-none">
          +91
        </span>
        <input
          type="tel"
          maxLength={10}
          inputMode="numeric"
          pattern="[0-9]*"
          value={profile[key] || ''}
          onChange={(e) => onChange(key, e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="9930000993"
          className="flex-1 min-w-0 h-9 px-2.5 rounded-r border border-[#C4C4C4] bg-white text-[13px] sm:text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]"
        />
      </div>
    </div>
  );

  // Show / hide a wallet (Paytm, PhonePe, Google Pay) on the card. A saved wallet is toggled at once
  // (PATCH payment/wallets/:walletId/visibility); a new one is sent as walletIsVisible on Save & Next.
  const hiddenPayments = profile.hiddenPayments || [];
  const renderShowCheckbox = (id: 'paytm' | 'phonePe' | 'gPay', label: string) => {
    const isShown = !hiddenPayments.includes(id);
    const toggle = async () => {
      const next = isShown ? [...hiddenPayments, id] : hiddenPayments.filter((p) => p !== id);
      onChange('hiddenPayments', next);
      const walletId = profile.walletIds?.[id];
      if (!walletId) {
        toast.success(`${label} will be ${isShown ? 'hidden from' : 'shown on'} the card when you save`);
        return;
      }
      try {
        await setWalletVisibility(walletId, !isShown, adminId);
        toast.success(`${label} ${isShown ? 'hidden from' : 'shown on'} card`);
      } catch (error: any) {
        onChange('hiddenPayments', hiddenPayments);
        toast.error(`API Error: ${error?.response?.data?.message || error?.message || 'Failed to save payment visibility'}`);
      }
    };
    return (
      <label className="flex items-center gap-2 text-[13px] font-semibold text-[#091426] cursor-pointer select-none">
        <input type="checkbox" checked={isShown} onChange={toggle} className="w-4 h-4 accent-[#2196F3] cursor-pointer" />
        Show {label} on card
      </label>
    );
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

    // Set fallback payment phone if not set
    const primaryPayPhone = profile.paytmPhone || profile.phonePePhone || profile.gPayPhone || profile.paymentPhoneNo || '';
    if (!profile.paymentPhoneNo && primaryPayPhone) {
      onChange('paymentPhoneNo', primaryPayPhone);
      onChange('upiNumber', primaryPayPhone);
    }

    const result = step5PaymentQRSchema.safeParse({
      upiId: profile.upiId || '',
      paymentPhoneNo: primaryPayPhone,
      upiNumber: primaryPayPhone,
      paytmPhone: profile.paytmPhone || '',
      phonePePhone: profile.phonePePhone || '',
      gPayPhone: profile.gPayPhone || '',
      bankName: profile.bankName || '',
      bankHolderName: profile.bankHolderName || profile.accountHolderName || '',
      accountHolderName: profile.accountHolderName || profile.bankHolderName || '',
      bankAccountNumber: profile.bankAccountNumber || profile.accountNumber || '',
      accountNumber: profile.accountNumber || profile.bankAccountNumber || '',
      bankIfscCode: enteredIfsc || null,
      ifscCode: enteredIfsc || null,
      accountType: profile.accountType || 'Savings Account',
      paytmQrUrl: profile.paytmQrUrl || null,
      phonePeQrUrl: profile.phonePeQrUrl || null,
      gPayQrUrl: profile.gPayQrUrl || null,
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
      // Saving recreates the wallets, so keep the new ids for the Show-on-card toggle
      const savedWalletIds = parseCustomerPaymentResponse(res).walletIds;
      if (savedWalletIds && Object.keys(savedWalletIds).length > 0) onChange('walletIds', savedWalletIds);
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
    <section className="bg-white border border-[#E0E0E0] rounded-lg p-2.5 sm:p-3.5 shadow-xs scroll-mt-28 font-['Roboto',Helvetica,Arial,sans-serif]" id="sec-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#E0E0E0] mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2196F3] flex items-center justify-center font-bold text-xs shrink-0">
            5
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
            Payment & QR Details
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {/* ─── 1. Bank & Account Details ─────────────────────────────────── */}
        <div className="p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] space-y-2.5">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#E0E0E0]">
            <Building className="w-4 h-4 text-[#2196F3]" />
            <h3 className="text-[13px] font-bold text-[#091426] uppercase tracking-wider">
              Bank & Account Details
            </h3>
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            {/* Row 1: Bank Name, IFSC & UPI ID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
              <div>
                <GenericInputField
                  label="Enter Bank Name (Optional)"
                  value={profile.bankName || ''}
                  onChange={(e) => onChange('bankName', e.target.value)}
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                />
              </div>

              <div>
                <GenericInputField
                  label="Enter IFSC code (Optional)"
                  value={profile.bankIfscCode || profile.ifscCode || ''}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                    onChange('bankIfscCode', val);
                    onChange('ifscCode', val);
                  }}
                  placeholder="e.g. HDFC0001234"
                  maxLength={11}
                />
                {(() => {
                  const ifsc = (profile.bankIfscCode || profile.ifscCode || '').trim().toUpperCase();
                  if (!ifsc) return null;
                  const isValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
                  if (isValid) {
                    return (
                      <span className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                        ✓ Valid IFSC
                      </span>
                    );
                  }
                  return (
                    <span className="text-[11px] text-amber-600 font-normal mt-1 block">
                      Format: 4 letters + 0 + 6 alphanumeric characters (e.g. HDFC0001234)
                    </span>
                  );
                })()}
              </div>

              <div>
                <GenericInputField
                  label="Enter UPI ID (Optional)"
                  value={profile.upiId || ''}
                  onChange={(e) => onChange('upiId', e.target.value.replace(/\s/g, ''))}
                  placeholder="e.g. business@okhdfcbank"
                />
                {(() => {
                  const upi = (profile.upiId || '').trim();
                  if (!upi) return null;
                  return /^[\w.-]{2,}@[a-zA-Z][a-zA-Z0-9.-]{1,}$/.test(upi) ? (
                    <span className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">✓ Valid UPI ID</span>
                  ) : (
                    <span className="text-[11px] text-amber-600 font-normal mt-1 block">Format: name@bank (e.g. business@okhdfcbank)</span>
                  );
                })()}
              </div>
            </div>

            {/* Row 2: Account Info (All 3 fields in ONE LINE on desktop!) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-1">
              {/* 1. Account Holder Name */}
              <div>
                <GenericInputField
                  label="Enter Account Holder Name (Optional)"
                  value={profile.bankHolderName || profile.accountHolderName || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChange('bankHolderName', val);
                    onChange('accountHolderName', val);
                  }}
                  placeholder="e.g. Company / Individual Name"
                />
              </div>

              {/* 2. Account Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[13px] sm:text-[14px] font-normal text-[#000000DE] truncate">
                    Enter Account Number (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAccountNo(!showAccountNo)}
                    className="text-[12px] text-[#2196F3] hover:underline font-medium flex items-center gap-1 shrink-0 ml-1"
                  >
                    {showAccountNo ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Reveal</span>
                      </>
                    )}
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
                  placeholder="e.g. 50100234567890"
                />
              </div>

              {/* 3. Account Type */}
              <div>
                <label className="block text-[13px] sm:text-[14px] font-normal text-[#000000DE] mb-1 truncate">
                  Enter Account Type (Optional)
                </label>
                <select
                  value={profile.accountType || 'Savings Account'}
                  onChange={(e) => onChange('accountType', e.target.value)}
                  className="w-full h-9 px-3 rounded border border-[#C4C4C4] bg-white text-[13px] sm:text-[14px] font-medium text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] focus:outline-none transition-colors"
                >
                  <option value="Savings Account">Savings Account</option>
                  <option value="Current Account">Current Account</option>
                </select>
              </div>
            </div>
          </div>
        </div>


        {/* ─── 2. Wallet Phone Numbers & QR Images ─────────────────────── */}
        <div className="p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] space-y-2.5">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#E0E0E0]">
            <QrCode className="w-4 h-4 text-[#2196F3]" />
            <h3 className="text-[13px] font-bold text-[#091426] uppercase tracking-wider">
              Wallet Phone Numbers & QR (Optional)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
            {/* 1. Paytm QR */}
            <div className="bg-white p-2.5 rounded-lg border border-[#E0E0E0] flex flex-col justify-between space-y-2">
              {renderShowCheckbox('paytm', 'Paytm')}
              <GenericInputField
                label="Name (Optional)"
                value={profile.paytmQrProviderName ?? 'Paytm'}
                onChange={(e) => onChange('paytmQrProviderName', e.target.value)}
                placeholder="Paytm"
              />
              {renderWalletPhoneInput('paytmPhone', 'Enter Paytm Phone No')}

              <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg border border-dashed border-[#C4C4C4] bg-gray-50/60 text-center min-h-[130px]">
                {profile.paytmQrUrl ? (
                  <div className="relative group flex flex-col items-center">
                    <img
                      src={profile.paytmQrUrl}
                      alt="Paytm QR"
                      className="w-20 h-20 object-contain rounded border border-[#E0E0E0] bg-white p-1"
                    />
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => paytmFileRef.current?.click()}
                        className="text-[12px] font-medium text-[#2196F3] hover:underline"
                      >
                        Change
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQr('paytmQrUrl', 'paytmQrUploaded', 'Paytm')}
                        className="text-[12px] font-medium text-red-600 hover:underline flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-[#2196F3] flex items-center justify-center mb-1">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-medium text-gray-700">Upload Paytm QR</span>
                    <span className="text-[11px] text-gray-400">PNG, JPG or WEBP</span>
                    <button
                      type="button"
                      onClick={() => paytmFileRef.current?.click()}
                      className="mt-1.5 px-3 py-1 text-[12px] font-medium rounded bg-[#2196F3] text-white hover:bg-[#1E88E5] transition-colors"
                    >
                      Browse Image
                    </button>
                  </div>
                )}
                <input
                  ref={paytmFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleQrUpload(e, 'paytmQrUrl', 'paytmQrUploaded', 'Paytm')}
                />
              </div>
            </div>

            {/* 2. PhonePe QR */}
            <div className="bg-white p-2.5 rounded-lg border border-[#E0E0E0] flex flex-col justify-between space-y-2">
              {renderShowCheckbox('phonePe', 'PhonePe')}
              <GenericInputField
                label="Name (Optional)"
                value={profile.phonePeQrProviderName ?? 'PhonePe'}
                onChange={(e) => onChange('phonePeQrProviderName', e.target.value)}
                placeholder="PhonePe"
              />
              {renderWalletPhoneInput('phonePePhone', 'Enter PhonePe Phone No')}

              <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg border border-dashed border-[#C4C4C4] bg-gray-50/60 text-center min-h-[130px]">
                {profile.phonePeQrUrl ? (
                  <div className="relative group flex flex-col items-center">
                    <img
                      src={profile.phonePeQrUrl}
                      alt="PhonePe QR"
                      className="w-20 h-20 object-contain rounded border border-[#E0E0E0] bg-white p-1"
                    />
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => phonePeFileRef.current?.click()}
                        className="text-[12px] font-medium text-[#2196F3] hover:underline"
                      >
                        Change
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQr('phonePeQrUrl', 'phonePeQrUploaded', 'PhonePe')}
                        className="text-[12px] font-medium text-red-600 hover:underline flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-[#2196F3] flex items-center justify-center mb-1">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-medium text-gray-700">Upload PhonePe QR</span>
                    <span className="text-[11px] text-gray-400">PNG, JPG or WEBP</span>
                    <button
                      type="button"
                      onClick={() => phonePeFileRef.current?.click()}
                      className="mt-1.5 px-3 py-1 text-[12px] font-medium rounded bg-[#2196F3] text-white hover:bg-[#1E88E5] transition-colors"
                    >
                      Browse Image
                    </button>
                  </div>
                )}
                <input
                  ref={phonePeFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleQrUpload(e, 'phonePeQrUrl', 'phonePeQrUploaded', 'PhonePe')}
                />
              </div>
            </div>

            {/* 3. Google Pay QR */}
            <div className="bg-white p-2.5 rounded-lg border border-[#E0E0E0] flex flex-col justify-between space-y-2">
              {renderShowCheckbox('gPay', 'Google Pay')}
              <GenericInputField
                label="Name (Optional)"
                value={profile.gPayQrProviderName ?? 'Google Pay'}
                onChange={(e) => onChange('gPayQrProviderName', e.target.value)}
                placeholder="Google Pay"
              />
              {renderWalletPhoneInput('gPayPhone', 'Enter Google Pay Phone No')}

              <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg border border-dashed border-[#C4C4C4] bg-gray-50/60 text-center min-h-[130px]">
                {profile.gPayQrUrl ? (
                  <div className="relative group flex flex-col items-center">
                    <img
                      src={profile.gPayQrUrl}
                      alt="Google Pay QR"
                      className="w-20 h-20 object-contain rounded border border-[#E0E0E0] bg-white p-1"
                    />
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => gPayFileRef.current?.click()}
                        className="text-[12px] font-medium text-[#2196F3] hover:underline"
                      >
                        Change
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQr('gPayQrUrl', 'gPayQrUploaded', 'Google Pay')}
                        className="text-[12px] font-medium text-red-600 hover:underline flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-[#2196F3] flex items-center justify-center mb-1">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-medium text-gray-700">Upload Google Pay QR</span>
                    <span className="text-[11px] text-gray-400">PNG, JPG or WEBP</span>
                    <button
                      type="button"
                      onClick={() => gPayFileRef.current?.click()}
                      className="mt-1.5 px-3 py-1 text-[12px] font-medium rounded bg-[#2196F3] text-white hover:bg-[#1E88E5] transition-colors"
                    >
                      Browse Image
                    </button>
                  </div>
                )}
                <input
                  ref={gPayFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleQrUpload(e, 'gPayQrUrl', 'gPayQrUploaded', 'Google Pay')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation Buttons */}
      <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 rounded border border-[#C4C4C4] bg-white text-[#000000DE] text-[14px] font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous: Links & Social</span>
          <span className="sm:hidden">Previous</span>
        </button>

        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-6 !py-2 !text-[14px] font-medium text-white shadow-none flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
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
