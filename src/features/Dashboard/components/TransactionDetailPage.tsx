/* eslint-disable */
import React, {useEffect, useState} from 'react';
import {Transaction} from '../types';
import {
  MdAccountBalance,
  MdCall,
  MdLock,
  MdArrowBack,
  MdCheckCircle,
  MdError,
  MdReceiptLong,
  MdShare,
  MdContentCopy,
  MdVisibility,
  MdRefresh,
  MdHourglassEmpty,
  MdCancel,
} from 'react-icons/md';
import {useNavigate, useParams} from '@tanstack/react-router';
import {transformApiTransaction} from '@/utils/formatters';
import {useGetTransactionById} from '../pages/dashboardmutation';
import toast from 'react-hot-toast';

interface ApiUser {
  fullname: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  dob: string | null;
  isVerified: boolean;
  isRejected: boolean;
}

interface ApiTransaction {
  id: string;
  walletId: string;
  particular: string;
  receiverId: string | null;
  senderId: string | null;
  beneficiaryId: string | null;
  amount: number;
  amountType: string;
  accountType: string;
  type: 'CREDIT' | 'DEBIT';
  rejectReason: string | null;
  isPending: boolean;
  isRejected: boolean;
  createdAt: string;
  updatedAt: string;
  beneficiary: any;
  user: ApiUser;
}

// Helper functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDateForPDF = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const TransactionDetailPage: React.FC = () => {
  const {id} = useParams({from: '/_app/wallet/transaction/$id'});
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [originalTransaction, setOriginalTransaction] =
    useState<ApiTransaction | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  const {
    data: apiTransactionData,
    isLoading,
    error,
    isError,
  } = useGetTransactionById(id || '');

  useEffect(() => {
    if (apiTransactionData) {
      setOriginalTransaction(apiTransactionData);
      const transformed = transformApiTransaction(apiTransactionData);
      setTransaction(transformed);
    }
  }, [apiTransactionData]);

  const handleCopyId = () => {
    if (originalTransaction?.id) {
      navigator.clipboard.writeText(originalTransaction.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Transaction ID copied!');
    }
  };

  const handleBackToHome = () => {
    navigate({to: '/dashboard'});
  };

  // ---------- Generate receipt HTML (with optional auto‑print script) ----------
  const generateReceiptHTML = (autoPrint = false): string => {
    if (!originalTransaction) return '';

    const isCredit = originalTransaction.type === 'CREDIT';
    const transactionType = isCredit ? 'Credit' : 'Debit';
    const amountSign = isCredit ? '+' : '-';
    const userName = originalTransaction?.user?.fullname || 'Unknown User';
    const userEmail = originalTransaction?.user?.email || 'No email';
    const userPhone = originalTransaction?.user?.phoneNumber || 'No phone';

    const transactionDate = new Date(originalTransaction.createdAt);
    const formattedDate = transactionDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = transactionDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const catererName = user?.fullname || 'Your Company Name';
    const catererEmail = user?.email || 'support@example.com';
    const catererPhone = user?.phoneNumber || '+1 234 567 8900';

    const autoPrintScript = autoPrint
      ? `
        <script>
          (function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            }, 300);
          })();
        </script>
      `
      : '';

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction Receipt</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { padding: 16px; background: white; color: #333; font-size: 14px; line-height: 1.4; max-width: 100%; overflow-x: hidden; }
        .receipt { width: 100%; max-width: 100%; margin: 0 auto; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        @media (min-width: 640px) { .receipt { max-width: 400px; padding: 20px; } }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px dashed #cbd5e0; }
        .company-name { font-size: 18px; font-weight: 700; margin-bottom: 4px; color: #F97316; word-wrap: break-word; }
        .receipt-title { font-size: 16px; font-weight: 600; margin: 12px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .amount-section { text-align: center; margin: 20px 0; padding: 20px 16px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; border: 1px solid #e2e8f0; }
        .amount { font-size: 28px; font-weight: 800; margin: 8px 0; color: ${isCredit ? '#059669' : '#dc2626'}; line-height: 1.2; }
        @media (min-width: 640px) { .amount { font-size: 32px; } }
        .status-badge { display: inline-block; padding: 6px 16px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 12px; letter-spacing: 0.3px; }
        .details-section { margin: 20px 0; }
        .detail-row { display: flex; flex-wrap: wrap; justify-content: space-between; margin: 12px 0; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
        .detail-label { font-weight: 500; color: #64748b; min-width: 120px; margin-bottom: 4px; }
        .detail-value { text-align: right; font-weight: 500; color: #1e293b; flex: 1; min-width: 0; overflow-wrap: break-word; word-break: break-word; }
        .transaction-id { margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
        .footer { margin-top: 24px; padding-top: 16px; border-top: 2px dashed #cbd5e0; text-align: center; font-size: 12px; color: #64748b; }
        .contact-info { margin-top: 12px; font-size: 11px; color: #94a3b8; line-height: 1.5; }
        @media print { @page { size: auto; margin: 5mm; } body { padding: 0; margin: 0; font-size: 12px; } .receipt { border: none; box-shadow: none; max-width: 100%; padding: 0; } .no-print { display: none !important; } }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="company-name">${catererName}</div>
            <div style="font-size: 13px; margin-bottom: 4px; color: #475569;">Transaction Receipt</div>
            <div style="font-size: 11px; color: #94a3b8;">Secure Digital Receipt</div>
        </div>
        
        <div class="amount-section">
            <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">Transaction Amount</div>
            <div class="amount">${amountSign}$${originalTransaction.amount.toFixed(2)}</div>
            <div style="font-size: 14px; margin: 8px 0; color: ${isCredit ? '#059669' : '#dc2626'}; font-weight: 600;">
                ${transactionType} • ${originalTransaction.amountType}
            </div>
            <div class="status-badge">COMPLETED</div>
        </div>
        
        <div class="details-section">
            <div class="receipt-title">Transaction Details</div>
            <div class="detail-row"><div class="detail-label">Type:</div><div class="detail-value">${transactionType}</div></div>
            <div class="detail-row"><div class="detail-label">${isCredit ? 'From' : 'To'}:</div><div class="detail-value">${userName}</div></div>
            <div class="detail-row"><div class="detail-label">Email:</div><div class="detail-value">${userEmail}</div></div>
            ${userPhone !== 'No phone' ? `<div class="detail-row"><div class="detail-label">Phone:</div><div class="detail-value">${userPhone}</div></div>` : ''}
            <div class="detail-row"><div class="detail-label">Account Type:</div><div class="detail-value">${originalTransaction.accountType === 'E_PRIVATEACCOUNT' ? 'E Private Account' : originalTransaction.accountType === 'E_TEMPORARYACCOUNT' ? 'E Temporary Account' : originalTransaction.accountType}</div></div>
            <div class="detail-row"><div class="detail-label">Description:</div><div class="detail-value">${originalTransaction.particular}</div></div>
            <div class="detail-row"><div class="detail-label">Date:</div><div class="detail-value">${formattedDate}</div></div>
            <div class="detail-row"><div class="detail-label">Time:</div><div class="detail-value">${formattedTime}</div></div>
            <div class="detail-row"><div class="detail-label">Reference:</div><div class="detail-value">${originalTransaction.id.slice(0, 8).toUpperCase()}</div></div>
        </div>
    </div>
    ${autoPrintScript}
</body>
</html>`;
  };

  // Open receipt in a new window (view only, no auto‑print)
  const handleViewReceipt = () => {
    if (!originalTransaction) return;
    setIsLoadingReceipt(true);

    const htmlContent = generateReceiptHTML(false); // no auto‑print
    const receiptWindow = window.open(
      '',
      '_blank',
      'width=500,height=700,scrollbars=yes,resizable=yes',
    );

    if (!receiptWindow) {
      toast.error('Please allow popups to view the receipt');
      setIsLoadingReceipt(false);
      return;
    }

    receiptWindow.document.open();
    receiptWindow.document.write(htmlContent);
    receiptWindow.document.title = `Receipt_${originalTransaction.id.slice(0, 8)}`;
    receiptWindow.document.close();
    setIsLoadingReceipt(false);
  };

  // Share receipt using Web Share API or fallback
  const handleShareReceipt = async () => {
    if (!originalTransaction) return;

    const shareData = {
      title: 'Transaction Receipt',
      text: `Amount: $${originalTransaction.amount.toFixed(2)}\nType: ${originalTransaction.type}\nDate: ${formatDate(originalTransaction.createdAt)}\nID: ${originalTransaction.id}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          toast.error('Sharing failed');
        }
      }
    } else {
      // Fallback: copy summary to clipboard
      const summary = `${shareData.title}\n${shareData.text}\nLink: ${shareData.url}`;
      await navigator.clipboard.writeText(summary);
      toast.success('Receipt details copied to clipboard!');
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-background-light dark:bg-background-dark flex min-h-screen w-full items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent sm:h-16 sm:w-16"></div>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            Loading transaction details...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="bg-background-light dark:bg-background-dark flex min-h-screen w-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-red-50 p-6 dark:bg-red-900/20">
          <MdError className="mx-auto mb-3 h-12 w-12 text-red-600 dark:text-red-400" />
          <p className="mb-2 text-center text-red-600 dark:text-red-400">
            Failed to load transaction
          </p>
          <p className="mb-4 text-center text-sm text-red-500 dark:text-red-300">
            {error?.message ||
              'An error occurred while loading transaction details'}
          </p>
          <button
            onClick={handleBackToHome}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-white hover:bg-blue-700"
          >
            <MdArrowBack />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!apiTransactionData || !transaction) {
    return (
      <div className="bg-background-light dark:bg-background-dark flex min-h-screen w-full items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4 inline-block rounded-full bg-slate-100 p-6 dark:bg-slate-800">
            <MdHourglassEmpty className="h-12 w-12 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Transaction Not Found</h2>
          <p className="mb-4 text-slate-600 dark:text-slate-300">
            The requested transaction could not be found.
          </p>
          <button
            onClick={handleBackToHome}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-white hover:bg-blue-700"
          >
            <MdArrowBack />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const rejectReason = apiTransactionData?.rejectReason || null;
  const userName = apiTransactionData?.user?.fullname || 'Unknown User';
  const userEmail = apiTransactionData?.user?.email || 'No email';
  const userPhone = apiTransactionData?.user?.phoneNumber || 'No phone';

  // ========== PENDING STATUS DESIGN ==========
  if (transaction?.status === 'Pending') {
    return (
      <div className="bg-background-light dark:bg-background-dark flex min-h-screen w-full flex-col text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex w-full items-center justify-between p-4 sm:p-6">
          <button
            onClick={handleBackToHome}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 sm:h-12 sm:w-12"
          >
            <MdArrowBack className="text-xl sm:text-2xl" />
          </button>
          <h2 className="text-lg font-bold sm:text-xl">
            Transfer Under Process
          </h2>
          <div className="w-10 sm:w-12"></div>
        </div>

        {/* Main Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 text-center sm:px-6">
          {/* Animated Spinner */}
          <div className="relative mb-8 flex items-center justify-center sm:mb-10">
            <div className="h-24 w-24 animate-spin rounded-full border-4 border-primary/10 border-t-primary sm:h-32 sm:w-32"></div>
            <div className="absolute flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:h-20 sm:w-20">
              <MdAccountBalance className="text-[32px] text-primary sm:text-[40px]" />
            </div>
          </div>

          <div className="w-full max-w-md space-y-4">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Transfer in Progress
            </h2>

            <div className="w-full rounded-2xl border border-blue-100/50 bg-blue-50/50 p-4 dark:border-blue-800/50 dark:bg-blue-900/10 sm:p-6">
              <p className="mb-1 text-lg font-semibold sm:text-xl">
                ${transaction.amount.toFixed(2)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {apiTransactionData.type === 'CREDIT' ? 'From' : 'To'}:{' '}
                {userName}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {transaction.title || apiTransactionData.particular}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1.5 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500"></div>
              Awaiting For Approval
            </div>

            <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
              We are securely processing your{' '}
              {apiTransactionData.type === 'CREDIT' ? 'top-up' : 'transfer'}
              {apiTransactionData.type === 'CREDIT'
                ? ' to your account'
                : ` to ${userName}`}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 sm:mt-8">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  // ========== APPROVED/SUCCESSFUL STATUS DESIGN ==========
  if (transaction?.status === 'Approved') {
    const isCredit = apiTransactionData.type === 'CREDIT';
    const transactionTitle = isCredit
      ? 'Top Up Successful'
      : 'Transfer Successful';

    return (
      <div className="bg-background-light dark:bg-background-dark relative flex min-h-screen w-full flex-col text-slate-900 dark:text-white">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -right-[10%] -top-[10%] h-[40%] w-[80%] rounded-full bg-blue-100/40 blur-[80px] dark:bg-blue-900/10"></div>
          <div className="absolute -left-[10%] top-[20%] h-[30%] w-[60%] rounded-full bg-blue-100/50 blur-[70px] dark:bg-blue-900/10"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 flex w-full items-center justify-between p-4 sm:p-6">
          <button
            onClick={handleBackToHome}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 sm:h-12 sm:w-12"
          >
            <MdArrowBack className="text-xl sm:text-2xl" />
          </button>
          <h2 className="text-lg font-bold sm:text-xl">Transaction Details</h2>
          <div className="w-10 sm:w-12"></div>
        </div>

        {/* Main Content */}
        <main className="relative z-10 flex flex-1 flex-col items-center px-4 pb-4 pt-4 sm:px-6 sm:pb-8 sm:pt-8">
          {/* Success Icon */}
          <div className="group relative mb-4 sm:mb-6">
            <div className="absolute inset-0 scale-125 transform rounded-full bg-primary/20 blur-xl transition-transform duration-700 group-hover:scale-150"></div>
            <div className="relative rounded-full bg-white p-2 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
              <MdCheckCircle className="block text-[56px] text-primary sm:text-[72px]" />
            </div>
          </div>

          <h1 className="mb-2 text-xl font-bold tracking-tight sm:text-2xl">
            {transactionTitle}
          </h1>

          <div className="mb-6 mt-2 text-center sm:mb-10">
            <span className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {isCredit ? '+' : '-'}${transaction.amount.toFixed(2)}
            </span>
          </div>

          {/* Transaction Details Card */}
          <div className="mb-auto w-full max-w-md rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Account Type */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Account Type
                </span>
                <span className="text-right font-bold">
                  {apiTransactionData.accountType === 'E_PRIVATEACCOUNT'
                    ? 'E Private Account'
                    : apiTransactionData.accountType === 'E_TEMPORARYACCOUNT'
                      ? 'E Temporary Account'
                      : apiTransactionData.accountType}
                </span>
              </div>
              <div className="h-px w-full bg-slate-100 dark:bg-slate-700/50"></div>

              {/* Date */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Date
                </span>
                <span className="font-bold">
                  {formatDate(apiTransactionData.createdAt)}
                </span>
              </div>
              <div className="h-px w-full bg-slate-100 dark:bg-slate-700/50"></div>

              {/* Time */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Time
                </span>
                <span className="font-bold">
                  {formatTime(apiTransactionData.createdAt)}
                </span>
              </div>
              <div className="h-px w-full bg-slate-100 dark:bg-slate-700/50"></div>

              {/* Transaction ID */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Transaction ID
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold tracking-tight sm:text-sm">
                    {apiTransactionData.id.slice(0, 8).toUpperCase()}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="relative text-slate-400 transition-colors hover:text-primary"
                  >
                    <MdContentCopy className="text-[14px] sm:text-[16px]" />
                    {copied && (
                      <span className="absolute -top-8 right-0 rounded bg-green-500 px-2 py-1 text-xs text-white">
                        Copied!
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Receipt Section – updated onClick and eye icon */}
            <div
              onClick={handleViewReceipt}
              className="group mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-black/20 dark:hover:bg-slate-800/30 sm:mt-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm transition-transform group-hover:scale-105 dark:bg-slate-800">
                <MdReceiptLong className="text-lg" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-sm font-bold">
                  Transaction_Receipt_{apiTransactionData.id.slice(0, 8)}.pdf
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PDF • Click to view receipt
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewReceipt();
                }}
                className="p-2 text-slate-400 transition-colors hover:text-primary"
                disabled={isLoadingReceipt}
              >
                {isLoadingReceipt ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                ) : (
                  <MdVisibility className="text-[16px]" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 w-full max-w-md space-y-3 sm:mt-8">
            <button
              onClick={handleShareReceipt}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-blue-700 active:scale-[0.98] sm:h-14 sm:text-lg"
            >
              <span>Share Receipt</span>
              <MdShare className="text-lg sm:text-[20px]" />
            </button>
            <button
              onClick={handleBackToHome}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-transparent text-base font-semibold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white sm:h-14 sm:text-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ========== REJECTED STATUS DESIGN ==========
  if (transaction?.status === 'Rejected') {
    const isCredit = apiTransactionData.type === 'CREDIT';

    return (
      <div className="bg-background-light dark:bg-background-dark flex min-h-screen w-full flex-col">
        {/* Header */}
        <div className="flex w-full items-center justify-between p-4 sm:p-6">
          <button
            onClick={handleBackToHome}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 sm:h-12 sm:w-12"
          >
            <MdArrowBack className="text-xl sm:text-2xl" />
          </button>
          <h2 className="text-lg font-bold sm:text-xl">Transaction Failed</h2>
          <div className="w-10 sm:w-12"></div>
        </div>

        {/* Main Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 text-center sm:px-6">
          {/* Error Icon */}
          <div className="relative mb-6 sm:mb-8">
            <div className="h-20 w-20 rounded-full border-4 border-red-500/10 sm:h-28 sm:w-28"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-white p-3 shadow-lg dark:bg-slate-800 sm:p-4">
                <MdCancel className="text-[36px] text-red-600 sm:text-[48px]" />
              </div>
            </div>
          </div>

          <div className="w-full max-w-md space-y-4">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Transaction Rejected
            </h2>

            <div className="w-full rounded-2xl border border-red-100/50 bg-red-50/50 p-4 dark:border-red-800/50 dark:bg-red-900/10 sm:p-6">
              <p className="mb-1 text-lg font-semibold text-red-600 dark:text-red-400 sm:text-xl">
                {isCredit ? '+' : '-'}${transaction.amount.toFixed(2)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {transaction.title || apiTransactionData.particular}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {isCredit ? 'From' : 'To'}: {userName}
              </p>
            </div>

            {/* Rejection Reason */}
            <div className="mt-4 w-full rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-800/30 dark:bg-red-900/20 sm:mt-6">
              <div className="flex items-start gap-3">
                <MdError className="mt-0.5 flex-shrink-0 text-lg text-red-600 dark:text-red-400 sm:text-xl" />
                <div className="text-left">
                  <p className="mb-1 text-sm font-medium text-red-800 dark:text-red-300 sm:text-base">
                    Transaction Declined
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 sm:text-sm">
                    {rejectReason ||
                      'Your transaction was rejected. This could be due to insufficient funds, security concerns, or account restrictions.'}
                  </p>
                </div>
              </div>
            </div>

            <p className="mx-auto text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
              Please check your account details and try again, or contact
              support for assistance.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 w-full max-w-md space-y-3 sm:mt-8">
            <button
              onClick={handleBackToHome}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white transition-colors hover:bg-blue-700 sm:h-14"
            >
              <MdRefresh />
              <span className="text-sm sm:text-base">
                Try Another Transaction
              </span>
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full p-4 sm:p-6">
          <div className="mx-auto max-w-md">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <MdLock className="text-sm sm:text-[14px]" />
              <span className="text-xs sm:text-[11px]">
                Secure End-to-End Encryption
              </span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ========== DEFAULT/OTHER STATUS ==========
  return (
    <div className="bg-background-light dark:bg-background-dark flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 inline-block rounded-full bg-slate-100 p-6 dark:bg-slate-800">
          <MdHourglassEmpty className="h-12 w-12 text-slate-400 dark:text-slate-500" />
        </div>
        <h2 className="mb-2 text-xl font-bold">Transaction Details</h2>
        <p className="mb-4 text-slate-600 dark:text-slate-300">
          Status: {transaction?.status || 'Unknown'}
        </p>
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          <p>
            Type: {apiTransactionData?.type === 'CREDIT' ? 'Credit' : 'Debit'}
          </p>
          <p>Amount: ${apiTransactionData?.amount?.toFixed(2) || '0.00'}</p>
          <p>User: {userName}</p>
          <p>Email: {userEmail}</p>
          {userPhone !== 'No phone' && <p>Phone: {userPhone}</p>}
          <p className="mt-2">Particular: {apiTransactionData?.particular}</p>
        </div>
        <button
          onClick={handleBackToHome}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-white hover:bg-blue-700"
        >
          <MdArrowBack />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default TransactionDetailPage;
