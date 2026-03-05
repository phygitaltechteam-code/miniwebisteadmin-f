import React, {useState, useCallback, useRef, useEffect} from 'react';
import {ArrowLeft, Lock} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';

import {PaymentData, WalletAmount} from './TopupWithdrawlFlow'; // adjust import path
import {Keypad} from '../Profilehub/ui/Keypad';
import {unAuthenticatedApi} from '@/utils/axios';

interface ExchangeRates {
  base: string;
  rates: {
    INR: number;
  };
  ts: number;
}

type Props = {
  paymentData: PaymentData;
  setPaymentData: React.Dispatch<React.SetStateAction<PaymentData>>;
  nextStep: () => void;
  prevStep: () => void;
  walletAmmount?: WalletAmount;
  accountType: 'E_PRIVATEACCOUNT' | 'E_TEMPORYACCOUNT';
  setAccountType: (type: 'E_PRIVATEACCOUNT' | 'E_TEMPORYACCOUNT') => void;
};

const WithdrawScreen: React.FC<Props> = ({
  paymentData,
  setPaymentData,
  nextStep,
  prevStep,
  accountType,
  setAccountType,
  walletAmmount = {E_PRIVATEACCOUNT: 0, E_TEMPORYACCOUNT: 0},
}) => {
  const navigate = useNavigate();
  const [isInputActive, setIsInputActive] = useState(false);

  // Exchange rate states
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usdAmount, setUsdAmount] = useState<string>('');

  const selectedBalance =
    accountType === 'E_PRIVATEACCOUNT'
      ? (walletAmmount.E_PRIVATEACCOUNT ?? 0)
      : (walletAmmount.E_TEMPORYACCOUNT ?? 0);

  const enteredAmount = Number(paymentData.amount || 0);
  const isInsufficientBalance = enteredAmount > selectedBalance;

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

  // Calculate USD equivalent whenever INR amount changes
  useEffect(() => {
    if (
      !rates ||
      !paymentData.amount ||
      paymentData.amount === '0' ||
      paymentData.amount === ''
    ) {
      setUsdAmount('');
      return;
    }

    const numAmount = parseFloat(paymentData.amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount < 0) {
      setUsdAmount('');
      return;
    }

    const inrToUsd = 1 / rates.rates.INR;
    const usdValue = numAmount * inrToUsd;
    setUsdAmount(usdValue.toFixed(4));
  }, [paymentData.amount, rates]);

  // ----- Keypad handlers (same logic as before) -----
  const handleKeyPress = useCallback(
    (key: string) => {
      setIsInputActive(true);
      setTimeout(() => setIsInputActive(false), 300);

      setPaymentData((prev) => {
        const value = prev.amount || '';

        // Prevent double decimal
        if (key === '.' && value.includes('.')) return prev;

        // Start with decimal
        if (value === '' && key === '.') {
          return {...prev, amount: '0.'};
        }

        // Limit to 2 decimal places
        if (value.includes('.')) {
          const [, decimals] = value.split('.');
          if (decimals?.length >= 2) return prev;
        }

        // Limit total digits (9 digits for crore range)
        if (value.replace('.', '').length >= 9) return prev;

        let nextAmount = value + key;

        // Replace leading zero
        if (value === '0' && key !== '.') {
          nextAmount = key;
        }

        if (Number(nextAmount) > selectedBalance) {
          toast.error('Insufficient wallet balance');
          return prev;
        }

        return {...prev, amount: nextAmount};
      });
    },
    [selectedBalance, setPaymentData],
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

  // Format the displayed amount with commas (same as TopUpScreen)
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

  return (
    <div className="font-inter flex h-screen flex-col bg-[#f8f6f5] text-[#0d131c] dark:bg-[#221610] dark:text-white">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200/50 bg-[#f8f6f5] px-4 pb-2 pt-4 dark:border-slate-800/50 dark:bg-[#221610] md:pt-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate({to: '/dashboard'})}
            className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5 text-[#0d131c] dark:text-white" />
          </button>
          <h2 className="text-center text-lg font-bold leading-tight md:text-xl">
            Withdraw Wallet
          </h2>
          <div className="w-10" /> {/* spacer */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Account Type Toggle */}
          <div className="shrink-0 px-4 pt-3 md:pt-4">
            <div className="flex w-full items-stretch rounded-xl bg-slate-200/50 p-1 dark:bg-[#1a2533]/50">
              <button
                onClick={() => setAccountType('E_PRIVATEACCOUNT')}
                className={`flex-1 rounded-lg border py-2.5 text-xs font-bold leading-tight transition-all md:py-3 md:text-sm ${
                  accountType === 'E_PRIVATEACCOUNT'
                    ? 'border-slate-100 bg-white text-[#F57F3d] shadow-sm dark:border-slate-700 dark:bg-[#1a2533]'
                    : 'border-transparent text-slate-500 hover:text-[#0d131c] dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                E Private Account
              </button>
              <button
                onClick={() => setAccountType('E_TEMPORYACCOUNT')}
                className={`flex-1 rounded-lg border py-2.5 text-xs font-bold leading-tight transition-all md:py-3 md:text-sm ${
                  accountType === 'E_TEMPORYACCOUNT'
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
              {/* Live Rate Indicator - Added */}
              {/* {rates && !loading && !error && (
                <div className="mb-2 text-center">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    1 USD = {rates.rates.INR.toFixed(2)} INR • 1 INR = {(1/rates.rates.INR).toFixed(4)} USD
                  </p>
                </div>
              )} */}

              {/* Available balance hint */}
              <p className="mb-1 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                Available: ₹{selectedBalance.toLocaleString('en-IN')}
              </p>

              <p className="mb-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400 md:mb-3 md:text-base">
                Enter Amount
              </p>

              <div className="mb-4 flex flex-col items-center justify-center md:mb-6">
                <div className="relative flex items-center justify-center">
                  <span className="mr-1 text-2xl font-bold text-[#0d131c] dark:text-white md:text-3xl">
                    ₹
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

                {/* USD Equivalent Display - Added below the amount */}
                {usdAmount &&
                  paymentData.amount &&
                  paymentData.amount !== '0' && (
                    <div className="mt-2 text-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        ≈ $ {parseFloat(usdAmount).toFixed(2)} USD
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

              {/* Security Notice (same as TopUpScreen) */}
              <div className="flex items-center justify-center gap-1.5 py-1 opacity-70 md:py-2">
                <Lock className="h-3 w-3 text-slate-400 dark:text-slate-500 md:h-3.5 md:w-3.5" />
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  Secure 256-bit SSL Encryption
                </p>
              </div>
            </div>
          </div>

          {/* Keypad - with submit button integrated (arrow icon) */}
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

export default WithdrawScreen;
