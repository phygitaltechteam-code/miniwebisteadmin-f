import {useNavigate, useLocation} from '@tanstack/react-router';
import React from 'react';
import {
  MdClose,
  MdSchedule,
  MdSecurity,
  MdTimelapse,
  MdArrowForward,
} from 'react-icons/md';

const StatusScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const recipient = location.state?.recipient;

  if (!recipient) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">No recipient information available.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-white/50 p-4 backdrop-blur-sm">
        <button
          className="text-navy flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
          onClick={() => navigate({to: '/wallet/paymentdashbord'})}
        >
          <MdClose className="text-2xl" />
        </button>
        <h2 className="text-navy absolute left-1/2 -translate-x-1/2 text-lg font-bold">
          Status
        </h2>
        <div className="w-10"></div> {/* Spacer for layout balance */}
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center overflow-y-auto px-6 pb-8 pt-4">
        {/* 3D Icon Container */}
        <div className="animate-float relative mb-10 mt-6">
          {/* Glow effect */}
          <div className="absolute inset-0 scale-110 rounded-full bg-primary/40 blur-[40px]"></div>

          {/* Main Circle */}
          <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-[6px] border-white/30 bg-gradient-to-br from-[#60A5FA] to-[#1D4ED8] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4),inset_0_2px_15px_rgba(255,255,255,0.4)] ring-1 ring-black/5">
            {/* Inner Bevel */}
            <div className="absolute inset-2 flex items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-primary to-blue-800 shadow-inner">
              {/* Glassy Top Reflection */}
              <div className="pointer-events-none absolute left-0 right-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/20 to-transparent"></div>
              <MdSchedule className="text-[4.5rem] text-white drop-shadow-md" />
            </div>

            {/* Badge Icon */}
            <div className="absolute -bottom-1 -right-1 z-10 flex rotate-6 items-center justify-center rounded-2xl border-[4px] border-white bg-black p-2.5 text-primary shadow-xl">
              <MdSecurity className="text-xl" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="mb-8 text-center">
          <h1 className="text-navy mb-4 text-2xl font-bold tracking-tight">
            Beneficiary Under Review
          </h1>

          <p className="mx-auto max-w-xs text-[15px] leading-relaxed text-slate-500">
            For your security, there is a mandatory{' '}
            <span className="text-navy font-bold">24-hour waiting period</span>{' '}
            before you can transfer funds to{' '}
            <span className="text-navy font-bold">{recipient.fullName}</span>.
            We will notify you once the verification is complete.
          </p>
        </div>

        {/* Info Card */}
        <div className="mb-auto flex w-full items-center gap-4 rounded-2xl border border-white/50 bg-white/60 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/10 text-primary">
            <MdTimelapse className="text-2xl" />
          </div>
          <div className="flex-1">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Estimated Completion
            </p>
            <div className="flex w-full items-center justify-between">
              <p className="text-navy text-base font-bold">
                Tomorrow, 10:45 AM
              </p>
              <span className="animate-pulse-slow h-2 w-2 rounded-full bg-primary"></span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 w-full">
          <button
            className="group flex h-14 w-full items-center justify-center gap-2 rounded-xl border-t border-white/20 bg-gradient-to-r from-primary to-[#1D4ED8] text-lg font-bold text-white shadow-[0_10px_20px_-5px_rgba(37,99,235,0.3)] transition-all hover:from-[#1D4ED8] hover:to-primary active:scale-[0.98]"
            onClick={() => navigate({to: '/wallet/paymentdashbord'})}
          >
            <span>Back to Dashboard</span>
            <MdArrowForward className="text-xl transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default StatusScreen;
