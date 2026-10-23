// components/OnboardingStep3.tsx

import type {FC} from 'react';

const OnboardingStep3: FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 flex min-h-screen w-full items-center justify-center overflow-hidden p-4 font-['Inter'] antialiased selection:bg-[#2563EB]/30">
      {/* Mobile frame wrapper */}
      <div className="border-gray-200/60 dark:border-gray-800/60 relative mx-auto min-h-[844px] w-full max-w-[390px] overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        {/* Skip button */}
        <div className="z-10 flex shrink-0 items-center justify-end px-6 pb-2 pt-6">
          <button className="flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold text-slate-500 transition-colors hover:text-[#2563EB] dark:text-slate-400 dark:hover:text-[#2563EB]">
            Skip
          </button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-4">
          {/* Chart visualization */}
          <div className="relative mb-8 flex w-full items-center justify-center">
            {/* Glow orb behind chart */}
            <div className="absolute -z-10 h-64 w-64 rounded-full bg-[#2563EB]/20 blur-3xl dark:bg-[#2563EB]/10" />

            <div className="group/chart relative isolate flex aspect-[4/3] w-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
              {/* Subtle grid background */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Fade gradient at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

              {/* Bars container with perspective */}
              <div className="perspective-[1000px] absolute inset-x-8 bottom-8 top-16 flex items-end justify-between gap-4">
                <div className="relative h-[30%] w-full origin-bottom transform-gpu rounded-t-sm border-t border-white/10 bg-slate-700/50 transition-all duration-500 ease-out hover:bg-slate-700/70 group-hover/chart:h-[35%]">
                  <div className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-400 shadow-[0_0_5px_rgba(148,163,184,0.5)]" />
                </div>

                <div className="relative h-[45%] w-full origin-bottom transform-gpu rounded-t-sm border-t border-white/10 bg-slate-600/50 transition-all delay-75 duration-500 ease-out hover:bg-slate-600/70 group-hover/chart:h-[50%]">
                  <div className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-300 shadow-[0_0_5px_rgba(203,213,225,0.5)]" />
                </div>

                <div className="relative h-[60%] w-full origin-bottom transform-gpu rounded-t-sm border-t border-white/10 bg-slate-500/50 transition-all delay-150 duration-500 ease-out hover:bg-slate-500/70 group-hover/chart:h-[65%]">
                  <div className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-200 shadow-[0_0_5px_rgba(226,232,240,0.5)]" />
                </div>

                <div className="relative h-[85%] w-full origin-bottom transform-gpu rounded-t-sm bg-gradient-to-b from-[#2563EB] to-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all delay-200 duration-500 ease-out group-hover/chart:h-[90%]">
                  <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 animate-pulse rounded-full bg-white shadow-[0_0_15px_white]" />
                </div>
              </div>

              {/* Rising arrow SVG trail */}
              <div className="pointer-events-none absolute inset-0">
                <svg className="h-full w-full" viewBox="0 0 300 225">
                  <defs>
                    <linearGradient
                      id="arrowTrail"
                      x1="0%"
                      x2="100%"
                      y1="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="transparent" />
                      <stop
                        offset="100%"
                        stopColor="#2563EB"
                        stopOpacity="0.8"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    className="drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                    d="M 40 160 Q 110 150 150 110 T 260 50"
                    fill="none"
                    stroke="url(#arrowTrail)"
                    strokeLinecap="round"
                    strokeWidth="4"
                  />
                  <path
                    className="drop-shadow-[0_0_8px_rgba(37,99,235,0.8)]"
                    d="M 245 50 L 260 50 L 260 65"
                    fill="none"
                    stroke="#2563EB"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                  />
                </svg>
              </div>

              {/* Floating total saved card */}
              <div className="absolute left-4 top-4 flex transform items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 p-3 shadow-lg backdrop-blur-md transition-transform hover:scale-105">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/20">
                  <span className="material-symbols-outlined text-sm text-[#2563EB]">
                    auto_graph
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium uppercase text-slate-400">
                    Total Saved
                  </span>
                  <span className="text-sm font-bold text-white">$12,450</span>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="w-full space-y-4 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              Spend Smarter,
              <br />
              Save Faster
            </h1>
            <p className="px-4 text-base font-normal leading-relaxed text-slate-600 dark:text-slate-400">
              Get personalized insights and automated budgeting to reach your
              goals.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="z-10 flex w-full shrink-0 flex-col gap-6 bg-[#f8fafc] px-6 pb-10 pt-4 dark:bg-[#0f172a]">
          {/* Progress dots */}
          <div className="flex w-full flex-row items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="h-2 w-8 rounded-full bg-[#2563EB] shadow-sm shadow-[#2563EB]/50 transition-all duration-300" />
          </div>

          {/* Get Started button */}
          <button className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#2563EB]/25 transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-[#2563EB]/40 active:scale-[0.98]">
            <span>Get Started</span>
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </button>

          <div className="h-1 w-full" />
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep3;
