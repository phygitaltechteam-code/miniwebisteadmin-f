// components/MobileBankingLogin.tsx

import type {FC} from 'react';

const MobileBankingLogin: FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 flex min-h-screen w-full items-center justify-center p-4 font-['Inter'] antialiased selection:bg-[#2563EB]/30">
      {/* Mobile frame simulation */}
      <div className="border-gray-200/60 dark:border-gray-800/60 relative mx-auto min-h-[844px] w-full max-w-[390px] overflow-hidden bg-white shadow-2xl dark:bg-[#221610]">
        {/* Background patterns */}
        <div className="bg-premium-pattern pointer-events-none absolute inset-0 z-0 opacity-100 dark:opacity-5" />
        <div className="from-gray-100/40 pointer-events-none absolute inset-0 z-0 bg-gradient-to-br via-transparent to-transparent dark:from-white/5" />

        {/* Safe area top spacer */}
        <div className="relative z-10 h-6 w-full" />

        {/* Main content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between px-6 pb-6 pt-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB]/10 backdrop-blur-sm">
              <span className="material-symbols-outlined text-2xl text-[#2563EB]">
                account_balance_wallet
              </span>
            </div>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight text-[#0d131c] dark:text-white">
              Welcome back
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
              Enter your details to access your account.
            </p>
          </div>

          {/* Form */}
          <div className="mt-8 flex flex-col gap-6">
            {/* Mobile Number */}
            <div className="flex flex-col gap-2">
              <label className="dark:text-gray-200 text-sm font-medium leading-normal text-[#0d131c]">
                Mobile Number
              </label>
              <div className="flex gap-3">
                <div className="relative w-[88px] shrink-0">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
                    <span className="text-lg leading-none">🇮🇳</span>
                  </div>
                  <select className="bg-gray-50/80 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 h-14 w-full cursor-pointer appearance-none rounded-xl border pl-10 pr-8 text-base backdrop-blur-sm focus:border-[#2563EB] focus:ring-[#2563EB] dark:text-white">
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <span className="material-symbols-outlined text-gray-400 text-sm">
                      expand_more
                    </span>
                  </div>
                </div>

                <input
                  className="bg-gray-50/80 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 placeholder-gray-400 h-14 flex-1 rounded-xl border px-4 text-base backdrop-blur-sm transition-shadow focus:border-[#2563EB] focus:ring-[#2563EB] dark:text-white"
                  placeholder="98765 43210"
                  type="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="dark:text-gray-200 text-sm font-medium leading-normal text-[#0d131c]">
                Password
              </label>
              <div className="relative">
                <input
                  className="bg-gray-50/80 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 placeholder-gray-400 h-14 w-full rounded-xl border pl-4 pr-12 text-base backdrop-blur-sm transition-shadow focus:border-[#2563EB] focus:ring-[#2563EB] dark:text-white"
                  placeholder="••••••••••••"
                  type="password"
                />
                <button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 absolute inset-y-0 right-0 flex items-center px-4 transition-colors"
                  type="button"
                  aria-label="Toggle password visibility"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{fontSize: '20px'}}
                  >
                    visibility_off
                  </span>
                </button>
              </div>
              {/* <div className="flex justify-end pt-1">
                <a
                  href="#"
                  className="text-sm font-medium text-[#2563EB] hover:underline"
                >
                  Forgot Password?
                </a>
              </div> */}
            </div>

            {/* Login Button */}
            <button className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 active:scale-[0.99]">
              <span>Login</span>
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="border-gray-100 dark:border-gray-800 flex-grow border-t" />
              <span className="text-gray-400 mx-4 flex-shrink-0 text-xs font-medium uppercase tracking-wider">
                Or login with
              </span>
              <div className="border-gray-100 dark:border-gray-800 flex-grow border-t" />
            </div>

            {/* Touch ID Button */}
            <button className="border-gray-200 dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 group flex h-14 w-full items-center justify-center gap-2 rounded-xl border bg-white/50 backdrop-blur-sm transition-colors">
              <span className="material-symbols-outlined text-[28px] text-[#2563EB] transition-transform group-hover:scale-110">
                fingerprint
              </span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Touch ID
              </span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-auto flex flex-col items-center gap-6 pt-8">
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
              Don't have an account?{' '}
              <a
                href="#"
                className="ml-1 font-semibold text-[#2563EB] transition-colors hover:text-blue-600"
              >
                Create an account
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileBankingLogin;
