import React, {useState, useCallback, useRef, useEffect} from 'react';
import {ArrowLeft, Lock, Camera} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';

import {
  PaymentData,
  SetPaymentData,
  SetSelectedWalletType,
  StepProps,
  walletAmmount,
} from './PaymentWrapper';
import {Keypad} from '@/components/Profilehub/ui/Keypad';
import {unAuthenticatedApi} from '@/utils/axios';

export type WalletType = 'E_PRIVATEACCOUNT' | 'E_TEMPORYACCOUNT';

interface ExchangeRates {
  base: string;
  rates: {
    INR: number;
  };
  ts: number;
}

type Props = StepProps & {
  paymentData: PaymentData;
  setPaymentData: SetPaymentData;
  walletAmmount: walletAmmount;
  setSelectedWalletType: SetSelectedWalletType;
  selectedWalletType: WalletType;
};

const PaymentSend: React.FC<Props> = ({
  paymentData,
  setPaymentData,
  nextStep,
  prevStep,
  walletAmmount,
  selectedWalletType,
  setSelectedWalletType,
}) => {
  const navigate = useNavigate();
  const [isInputActive, setIsInputActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inrAmount, setInrAmount] = useState<string>('');
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedWalletBalance = walletAmmount?.[selectedWalletType] ?? 0;
  const enteredAmount = Number(paymentData.amount || 0);
  const isInsufficientBalance = enteredAmount > selectedWalletBalance;

  // Fetch exchange rates
  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await unAuthenticatedApi.get(
        'https://api.exchangerate-api.com/v4/latest/USD',
      );
      setRates(res.data);
      setError(null);
    } catch (err) {
      setError('Unable to fetch exchange rates');
      console.error('Error fetching rates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Calculate INR equivalent whenever USD amount changes
  useEffect(() => {
    if (
      !rates ||
      !paymentData.amount ||
      paymentData.amount === '0' ||
      paymentData.amount === ''
    ) {
      setInrAmount('');
      return;
    }

    const numAmount = parseFloat(paymentData.amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount < 0) {
      setInrAmount('');
      return;
    }

    const usdToInr = rates.rates.INR;
    const inrValue = numAmount * usdToInr;
    setInrAmount(inrValue.toFixed(2));
  }, [paymentData.amount, rates]);

  // Format amount with commas (same as TopUpScreen)
  const formattedValue = () => {
    const raw = paymentData.amount || '';
    if (raw === '' || raw === '0') return '0';

    if (raw.endsWith('.')) {
      const integerPart = parseInt(raw.slice(0, -1) || '0', 10);
      return integerPart.toLocaleString('en-IN') + '.';
    }

    const parts = raw.split('.');
    const integerPart = parseInt(parts[0] || '0', 10);
    const formattedInteger = integerPart.toLocaleString('en-IN');

    if (parts.length > 1) {
      const decimalPart = parts[1].slice(0, 2);
      return `${formattedInteger}.${decimalPart}`;
    }

    return formattedInteger;
  };

  // Keypad handlers
  const handleKeyPress = useCallback(
    (key: string) => {
      setIsInputActive(true);
      setTimeout(() => setIsInputActive(false), 300);

      setPaymentData((prev) => {
        const value = prev.amount || '';

        if (key === '.' && value.includes('.')) return prev;

        if (value === '0' && key !== '.') {
          const nextAmount = key;
          if (Number(nextAmount) > selectedWalletBalance) {
            toast.error('Insufficient wallet balance');
            return prev;
          }
          return {...prev, amount: nextAmount};
        }

        if (value === '' && key === '.') {
          return {...prev, amount: '0.'};
        }

        if (value.includes('.')) {
          const [, decimals] = value.split('.');
          if (decimals?.length >= 2) return prev;
        }

        if (value.replace('.', '').length >= 7) return prev; // adjust digit limit as needed

        const nextAmount = value + key;
        if (Number(nextAmount) > selectedWalletBalance) {
          toast.error('Insufficient wallet balance');
          return prev;
        }

        return {
          ...prev,
          ...(selectedFile && {proof: selectedFile}), // include proof if attached
          amount: nextAmount,
        };
      });
    },
    [selectedWalletBalance, selectedFile, setPaymentData],
  );

  const handleBackspace = useCallback(() => {
    setIsInputActive(true);
    setTimeout(() => setIsInputActive(false), 300);

    setPaymentData((prev) => {
      const value = prev.amount || '';
      if (value.length <= 1) {
        return {...prev, amount: ''};
      }
      return {...prev, amount: value.slice(0, -1)};
    });
  }, [setPaymentData]);

  const handleContinue = () => {
    if (isInsufficientBalance || enteredAmount <= 0) {
      toast.error('Insufficient wallet balance');
      return;
    }
    nextStep();
  };

  // File handlers
  const handleAttachReceipt = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPaymentData((prev) => ({...prev, proof: file}));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPaymentData((prev) => ({...prev, proof: undefined}));
  };

  return (
    <div className="font-inter flex h-screen flex-col bg-[#f8f6f5] text-[#0d131c] dark:bg-[#221610] dark:text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200/50 bg-[#f8f6f5] px-4 pb-2 pt-4 dark:border-slate-800/50 dark:bg-[#221610] md:pt-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate({to: '/wallet/paymentdashbord'})}
            className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5 text-[#0d131c] dark:text-white" />
          </button>
          <h2 className="text-center text-lg font-bold leading-tight md:text-xl">
            Send Money
          </h2>
          <div className="w-10" /> {/* spacer */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Account Type Toggle (identical to TopUpScreen) */}
          <div className="shrink-0 px-4 pt-3 md:pt-4">
            <div className="flex w-full items-stretch rounded-xl bg-slate-200/50 p-1 dark:bg-[#1a2533]/50">
              <button
                onClick={() => setSelectedWalletType('E_PRIVATEACCOUNT')}
                className={`flex-1 rounded-lg border py-2.5 text-xs font-bold leading-tight transition-all md:py-3 md:text-sm ${
                  selectedWalletType === 'E_PRIVATEACCOUNT'
                    ? 'border-slate-100 bg-white text-[#F57F3d] shadow-sm dark:border-slate-700 dark:bg-[#1a2533]'
                    : 'border-transparent text-slate-500 hover:text-[#0d131c] dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                E Private Account
              </button>
              <button
                onClick={() => setSelectedWalletType('E_TEMPORYACCOUNT')}
                className={`flex-1 rounded-lg border py-2.5 text-xs font-bold leading-tight transition-all md:py-3 md:text-sm ${
                  selectedWalletType === 'E_TEMPORYACCOUNT'
                    ? 'border-slate-100 bg-white text-[#F57F3d] shadow-sm dark:border-slate-700 dark:bg-[#1a2533]'
                    : 'border-transparent text-slate-500 hover:text-[#0d131c] dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Temporarily Virtual Account
              </button>
            </div>
          </div>

          {/* Amount Display Section */}
          <div className="flex flex-1 flex-col items-center justify-center px-4 md:px-8">
            <div className="w-full max-w-xs md:max-w-sm">
              {/* Live Rate Indicator */}
              {/* {rates && !loading && !error && (
                <div className="mb-2 text-center">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    1 USD = {rates.rates.INR.toFixed(2)} INR
                  </p>
                </div>
              )} */}

              {/* Available balance hint */}
              <p className="mb-1 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                Available: ${selectedWalletBalance.toLocaleString('en-IN')}
              </p>

              <p className="mb-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400 md:mb-3 md:text-base">
                Enter Amount (USD)
              </p>

              <div className="mb-4 flex flex-col items-center justify-center md:mb-6">
                <div className="relative flex items-center justify-center">
                  <span className="mr-1 text-2xl font-bold text-[#0d131c] dark:text-white md:text-3xl">
                    $
                  </span>
                  <div className="relative min-w-0 max-w-full overflow-visible">
                    <div
                      className={`min-w-0 max-w-full overflow-visible border-none bg-transparent p-0 text-center font-bold text-[#0d131c] dark:text-white ${
                        formattedValue().length > 12
                          ? 'text-2xl md:text-3xl'
                          : 'text-3xl md:text-4xl'
                      }`}
                    >
                      {formattedValue()}
                    </div>
                    <div
                      className={`absolute bottom-[-4px] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F57F3d] to-transparent transition-all duration-300 ${
                        isInputActive
                          ? 'scale-x-100 opacity-100'
                          : 'scale-x-0 opacity-0'
                      }`}
                    />
                    <div className="absolute bottom-[-6px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600" />
                  </div>
                </div>

                {/* INR Equivalent Display - Shows when USD amount is entered */}
                {inrAmount &&
                  paymentData.amount &&
                  paymentData.amount !== '0' && (
                    <div className="mt-2 text-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        ≈ ₹{' '}
                        {parseFloat(inrAmount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        INR
                      </p>
                    </div>
                  )}

                {/* Error Display - If rates fail to load */}
                {error && (
                  <div className="mt-2 text-center">
                    <p className="text-xs text-red-500">
                      {error}. Using cached rates.
                    </p>
                  </div>
                )}
              </div>

              {/* Attach Receipt (same as TopUpScreen) */}
              <div className="mb-4 flex w-full flex-col items-center md:mb-6">
                {selectedFile ? (
                  <div className="flex w-full items-center justify-between gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-[#1a2533] dark:text-slate-300 md:py-2.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Camera className="h-4 w-4 shrink-0 text-[#F57F3d]" />
                      <span className="truncate">{selectedFile.name}</span>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="ml-2 shrink-0 text-sm text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAttachReceipt}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#1a2533] dark:text-slate-300 dark:hover:bg-slate-700 md:py-2.5"
                  >
                    <Camera className="h-4 w-4 text-[#F57F3d]" />
                    Attach Receipt (Optional)
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Security Notice */}
              <div className="flex items-center justify-center gap-1.5 py-1 opacity-70 md:py-2">
                <Lock className="h-3 w-3 text-slate-400 dark:text-slate-500 md:h-3.5 md:w-3.5" />
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  Secure 256-bit SSL Encryption
                </p>
              </div>
            </div>
          </div>

          {/* Keypad - with integrated submit button (arrow) */}
          <div className="shrink-0">
            <Keypad
              onKeyPress={handleKeyPress}
              onDelete={handleBackspace}
              onSubmit={handleContinue}
              showBiometric={false}
              submitIcon="arrow"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSend;
