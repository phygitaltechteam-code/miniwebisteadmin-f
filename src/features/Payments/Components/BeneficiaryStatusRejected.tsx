import React from 'react';
import {useNavigate, useLocation} from '@tanstack/react-router';
import {
  MdCancel,
  MdError,
  MdLock,
  MdArrowBack,
  MdRefresh,
  MdHome,
  MdEdit,
} from 'react-icons/md';

const BeneficiaryStatusRejected = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const recipient = location.state?.recipient;

  const rejectionReason = recipient?.rejectReason;

  const handleEditBeneficiary = () => {
    if (recipient?.id) {
      navigate({
        to: `/updatebeneficiary/${recipient.id}`,
        state: {recipient},
      });
    }
  };

  const handleTryAgain = () => {
    if (recipient?.id) {
      navigate({
        to: `/beneficiary/add`,
        state: {retryData: recipient},
      });
    }
  };

  const handleGoHome = () => {
    navigate({to: '/'});
  };

  const handleGoBack = () => {
    navigate({to: '/wallet/paymentdashbord'});
  };

  return (
    <div className="bg-background-light dark:bg-background-dark flex min-h-screen w-full flex-col">
      {/* Header */}
      <div className="flex w-full items-center justify-between p-4 sm:p-6">
        <button
          onClick={handleGoBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 sm:h-12 sm:w-12"
        >
          <MdArrowBack className="text-xl sm:text-2xl" />
        </button>
        <h2 className="text-lg font-bold sm:text-xl">Beneficiary Rejected</h2>
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
            Beneficiary Rejected
          </h2>

          {/* Beneficiary Details */}
          {recipient && (
            <div className="w-full rounded-2xl border border-red-100/50 bg-red-50/50 p-4 dark:border-red-800/50 dark:bg-red-900/10 sm:p-6">
              <p className="mb-2 text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
                {recipient.fullName}
              </p>
              {recipient.accountNumber && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Account: {recipient.accountNumber}
                </p>
              )}
              {recipient.bankName && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Bank: {recipient.bankName}
                </p>
              )}
            </div>
          )}

          {/* Rejection Reason - Matching Transaction Failed Design */}
          <div className="mt-4 w-full rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-800/30 dark:bg-red-900/20 sm:mt-6">
            <div className="flex items-start gap-3">
              <MdError className="mt-0.5 flex-shrink-0 text-lg text-red-600 dark:text-red-400 sm:text-xl" />
              <div className="text-left">
                <p className="mb-1 text-sm font-medium text-red-800 dark:text-red-300 sm:text-base">
                  Why was it rejected?
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 sm:text-sm">
                  {rejectionReason}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BeneficiaryStatusRejected;
