// components/OnboardingStep2.tsx

import type {FC} from 'react';

const OnboardingStep2: FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 flex min-h-screen w-full items-center justify-center p-4 font-['Inter'] antialiased selection:bg-[#2563EB]/30">
      {/* Mobile frame wrapper */}
      <div className="relative mx-auto min-h-[844px] w-full max-w-[390px] overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        {/* Background effects */}
        <div className="bg-grid-pattern absolute inset-0 z-0 opacity-60" />
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#2563EB]/5 blur-[100px]" />
        <div className="absolute -left-20 bottom-20 h-72 w-72 rounded-full bg-blue-500/5 blur-[80px]" />

        {/* Skip button */}
        <div className="relative z-20 mt-2 flex justify-end px-6 py-4">
          <button className="flex items-center justify-center rounded-full border border-white/20 bg-white/50 px-4 py-2 text-sm font-semibold text-slate-500 backdrop-blur-sm transition-colors hover:bg-slate-100 dark:bg-black/20 dark:text-slate-400 dark:hover:bg-slate-800">
            <span className="truncate">Skip</span>
          </button>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-6">
          {/* Illustration container */}
          <div className="perspective-[1000px] relative mb-8 flex aspect-square w-full max-w-[340px] items-center justify-center">
            {/* Glow background */}
            <div className="animate-pulse-glow absolute inset-0 scale-90 transform rounded-full bg-gradient-to-tr from-[#2563EB]/20 to-blue-400/20 blur-3xl dark:from-[#2563EB]/10 dark:to-blue-600/10" />

            {/* Central 3D wallet card */}
            <div className="wallet-3d relative z-10 flex h-52 w-52 items-center justify-center overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-white to-slate-50 ring-1 ring-slate-900/5 dark:border-slate-600 dark:from-slate-800 dark:to-slate-900 dark:ring-white/10">
              <div className="glass-reflection pointer-events-none absolute inset-0 z-20" />
              <div
                className="relative z-10 h-full w-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD5YMHE5fDMxnz9zsE8nGE8d2tbhVmPa3cwyugjN5XaO97Cg5fEtWaQH9ceqqvQHy5JzlQ5_EmDA2I-aOIf3moRKJdHOfCwSffi-GLY7YvJ_mrO9Sp5Zn3GFEt8em-qFfThGA_LeatrfBhUw3nGRtKUQLg8AWsUfPNJstZxJYPHh7HRC_iWxJPtPEGvhxA-krCrtbhQZs6oxW9i8eJywsSZxNCNx8cuVguyQjTZURJpfQ8WJERD1S8d5eCz5IejGqL-Aje8Na3OeUmr")',
                }}
                title="3D digital wallet illustration with blue gradients"
              />
            </div>

            {/* Floating currency icons */}
            <div className="shadow-glow animate-float absolute left-8 top-8 z-20 flex items-center justify-center rounded-2xl border border-white/50 bg-white p-3.5 backdrop-blur-md dark:bg-slate-800">
              <span className="material-symbols-outlined text-2xl font-bold text-[#2563EB] drop-shadow-sm">
                euro_symbol
              </span>
            </div>

            <div className="shadow-glow-lg animate-float-delayed absolute bottom-10 right-4 z-30 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-blue-600 p-5 text-white ring-4 ring-white/20 dark:ring-black/20">
              <span className="material-symbols-outlined text-3xl font-bold drop-shadow-md">
                attach_money
              </span>
            </div>

            <div className="animate-float absolute right-12 top-4 z-10 flex items-center justify-center rounded-xl border border-slate-100 bg-white/90 p-2.5 shadow-lg backdrop-blur-sm dark:border-slate-600 dark:bg-slate-700/90">
              <span className="material-symbols-outlined text-xl font-bold text-blue-600 dark:text-blue-400">
                currency_pound
              </span>
            </div>

            <div className="animate-float-delayed absolute bottom-8 left-12 z-10 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50/90 p-3 shadow-lg backdrop-blur-sm dark:border-slate-500 dark:bg-slate-600/90">
              <span className="material-symbols-outlined text-xl font-bold text-slate-600 dark:text-slate-200">
                currency_rupee
              </span>
            </div>

            <div className="animate-float absolute -right-2 top-1/2 z-0 rounded-lg bg-[#2563EB]/10 p-2 opacity-60 dark:bg-[#2563EB]/20">
              <span className="material-symbols-outlined text-sm font-bold text-[#2563EB]/60">
                currency_yen
              </span>
            </div>
          </div>

          {/* Text content */}
          <div className="relative z-10 space-y-4 text-center">
            <h1 className="px-2 text-4xl font-bold leading-tight tracking-tight text-slate-900 drop-shadow-sm dark:text-white">
              Go Global with <br />
              <span className="bg-gradient-to-r from-[#2563EB] to-blue-600 bg-clip-text text-transparent">
                Multi-Currency
              </span>
            </h1>
            <p className="mx-auto max-w-xs px-4 text-lg font-normal leading-relaxed text-slate-500 dark:text-slate-400">
              Hold, exchange, and spend in 30+ currencies with real-time rates.
            </p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="relative z-20 w-full px-6 pb-10 pt-6">
          {/* Progress indicators */}
          <div className="flex w-full flex-row items-center justify-center gap-2.5 py-6">
            <div className="h-2 w-2 rounded-full bg-slate-200 transition-all dark:bg-slate-700" />
            <div className="shadow-glow h-2 w-10 rounded-full bg-gradient-to-r from-[#2563EB] to-blue-500" />
            <div className="h-2 w-2 rounded-full bg-slate-200 transition-all dark:bg-slate-700" />
          </div>

          {/* Next button */}
          <button className="group flex h-14 w-full transform cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563EB] to-blue-600 px-4 text-lg font-semibold leading-normal tracking-wide text-white shadow-lg shadow-[#2563EB]/30 transition-all hover:-translate-y-0.5 hover:from-blue-500 hover:to-[#2563EB] hover:shadow-[#2563EB]/50 active:translate-y-0">
            <span className="mr-2 truncate">Next</span>
            <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep2;
