// components/BiometricSetup.tsx

import type {FC} from 'react';

const BiometricSetup: FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 flex min-h-screen w-full items-center justify-center p-4 font-['Inter'] antialiased selection:bg-[#2563EB]/30">
      {/* Mobile frame wrapper */}
      <div className="border-gray-200/60 dark:border-gray-800/60 relative mx-auto min-h-[844px] w-full max-w-[390px] overflow-hidden bg-[#f8fafc] shadow-2xl dark:bg-[#0f172a]">
        {/* Background grid + fade */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <svg
            className="absolute h-full w-full text-slate-900/5 opacity-60 dark:text-white/5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid-pattern"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M32 0H0V32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f8fafc]/40 to-[#f8fafc] dark:via-[#0f172a]/40 dark:to-[#0f172a]" />
        </div>

        {/* Header with back & step indicator */}
        <div className="relative z-20 flex shrink-0 items-center justify-between p-4 pb-2">
          <button className="flex size-12 shrink-0 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-slate-200 dark:text-white dark:hover:bg-slate-800">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1" />
          <span className="pr-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            Step 5 of 10
          </span>
        </div>

        {/* Main content */}
        <div className="relative z-10 -mt-10 flex w-full flex-1 flex-col items-center justify-center px-6">
          {/* Biometric illustration container */}
          <div className="@container relative mb-10 flex w-full justify-center py-12">
            {/* Concentric circles */}
            <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center">
              <div className="h-[320px] w-[320px] rounded-full border border-slate-200/60 dark:border-white/5" />
              <div className="absolute h-[240px] w-[240px] rounded-full border border-dashed border-[#2563EB]/20 dark:border-[#2563EB]/10" />
              <div className="absolute flex h-[180px] w-[180px] items-center justify-center rounded-full border border-[#2563EB]/30">
                <div className="absolute top-0 h-3 w-1 -translate-y-1/2 bg-[#2563EB]/40" />
                <div className="absolute bottom-0 h-3 w-1 translate-y-1/2 bg-[#2563EB]/40" />
                <div className="absolute left-0 h-1 w-3 -translate-x-1/2 bg-[#2563EB]/40" />
                <div className="absolute right-0 h-1 w-3 translate-x-1/2 bg-[#2563EB]/40" />
              </div>
            </div>

            {/* Central fingerprint icon */}
            <div
              className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-white to-slate-50 shadow-2xl shadow-[#2563EB]/10 ring-4 ring-white dark:from-slate-800 dark:to-slate-900 dark:ring-slate-800/50"
              title="Biometric fingerprint security icon"
            >
              <span
                className="material-symbols-outlined bg-gradient-to-br from-[#2563EB] to-blue-600 bg-clip-text text-[64px] text-transparent"
                style={{fontSize: '64px'}}
              >
                fingerprint
              </span>
            </div>

            {/* Success checkmark badge */}
            <div className="absolute bottom-10 z-20 flex translate-y-2 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500 p-1.5 shadow-sm dark:border-[#0f172a]">
              <span
                className="material-symbols-outlined text-[16px] text-white"
                style={{fontSize: '16px', fontWeight: 700}}
              >
                check
              </span>
            </div>
          </div>

          {/* Text */}
          <h1 className="pb-3 text-center text-[32px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
            Enable Secure Access
          </h1>
          <p className="max-w-[320px] text-center text-base font-normal leading-relaxed text-slate-500 dark:text-slate-400">
            Use biometrics for faster login and to authorize payments securely
            without typing your password.
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="z-20 mx-auto w-full max-w-md px-4 pb-8 pt-4">
          {/* Security badge */}
          <div className="mb-6 flex items-center justify-center gap-2 opacity-80">
            <span className="material-symbols-outlined text-[20px] text-slate-400 dark:text-slate-500">
              verified_user
            </span>
            <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Protected by Secure Enclave
            </p>
          </div>

          {/* Enable button */}
          <div className="mb-3 flex w-full">
            <button className="flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#2563EB] to-blue-600 px-5 text-base font-bold leading-normal tracking-[0.015em] text-white shadow-lg shadow-[#2563EB]/30 transition-all hover:from-blue-500 hover:to-blue-700 active:scale-[0.98]">
              <span className="truncate">Enable Now</span>
            </button>
          </div>

          {/* Skip button */}
          <div className="flex w-full">
            <button className="flex h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-transparent px-5 text-base font-semibold leading-normal tracking-[0.015em] text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <span className="truncate">Maybe Later</span>
            </button>
          </div>
        </div>

        <div className="h-4 w-full" />
      </div>
    </div>
  );
};

export default BiometricSetup;
