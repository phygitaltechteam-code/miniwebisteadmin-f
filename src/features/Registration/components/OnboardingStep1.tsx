// components/OnboardingStep1.tsx

import type {FC} from 'react';

const OnboardingStep1: FC = () => {
  return (
    <div className="bg-gray-100 dark:bg-gray-950 flex min-h-screen w-full items-center justify-center font-['Inter'] antialiased selection:bg-[#2563EB]/30">
      {/* Mobile frame simulation wrapper */}
      <div className="relative mx-auto min-h-[844px] w-full max-w-[390px] overflow-hidden bg-white dark:bg-[#0B162C]">
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="mesh-bg absolute inset-0 hidden dark:block" />
          <div
            className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMDQwIDBoNDB2NDB6IiBmaWxsPSJub25lIiBzdHJva2U9IiNlN2U1ZTQiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')]"
            style={{opacity: 0.4}}
          />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/20 mix-blend-screen blur-[100px]" />
          <div className="pointer-events-none absolute left-1/2 top-[30%] h-[40%] w-[80%] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[80px] dark:bg-blue-400/5" />
        </div>

        {/* Skip button */}
        <div className="relative z-20 flex w-full items-center justify-end px-5 pb-1 pt-10">
          <button className="group flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-[#2563EB] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-[#2563EB]">
            Skip
          </button>
        </div>

        {/* Main content - centered vertically */}
        <div className="relative z-10 flex min-h-[calc(100%-140px)] flex-1 flex-col items-center justify-center px-5">
          <div className="relative flex w-full flex-1 items-center justify-center py-6">
            {/* Glow orb */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 animate-pulse rounded-full bg-gradient-to-tr from-[#2563EB]/30 to-blue-600/30 opacity-60 blur-3xl" />
            </div>

            {/* Illustration */}
            <div className="relative z-10 max-h-[380px] w-full">
              <div
                className="aspect-[4/5] h-full w-full bg-contain bg-center bg-no-repeat drop-shadow-2xl transition-transform duration-700 ease-out hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB4KSpWCRHKqEPZ_VWPUvywSoshRqI4REwhwv8ekA-YfcTb1gzJazAPy9gI1HZ9SVYaYI_CgwdviY8zZ1Kkrn9se4EuPww4rd83JeUswR92hI_PaBzvPFzDLx20qTksYsGqYMG-zR7JVp0wXnLlr_YiCnfF11-Gqc0pOU89iu5E7wz1SI6hNliQXmQCrSNrTKZzac0W0P9YYnfBs6zKf6vFo3xqJdv2eC7fLxl3htaPKyoyFSaVzx2enNtP06uyWuqqD1YAYyt8P_x7')",
                }}
                title="Abstract 3D digital shield and mobile interface illustration showing security"
              />
            </div>
          </div>

          {/* Text */}
          <div className="z-10 flex w-full flex-col items-center px-6 pb-10 text-center">
            <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 drop-shadow-sm dark:text-white">
              Simplify Your Finances
            </h1>
            <p className="max-w-[320px] text-base font-normal leading-relaxed text-slate-600 dark:text-slate-400">
              Manage your checking, savings, and investments all in one secure
              place. Banking that moves as fast as you do.
            </p>
          </div>
        </div>

        {/* Bottom CTA area */}
        <div className="relative z-20 flex w-full flex-col items-center justify-end gap-8 px-5 pb-10 pt-6">
          {/* Progress indicators */}
          <div className="flex items-center gap-2.5">
            <div className="h-1.5 w-8 rounded-full bg-[#2563EB] shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-300" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700/50" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700/50" />
          </div>

          {/* Get Started button */}
          <button className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] py-4 text-base font-bold text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.4)] ring-1 ring-white/10 transition-all duration-200 hover:from-[#1D4ED8] hover:to-[#2563EB] active:scale-95">
            <span>Get Started</span>
            <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep1;
