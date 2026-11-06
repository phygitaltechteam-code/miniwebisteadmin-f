/*eslint-disable*/
import { useAuthContext } from '@/context/AuthContext';
import { api, setEmployeePortal } from '@/utils/axios';
import { employeeLogin } from '@/lib/api/employee/auth';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SigninProps {
  onSuccess?: (role?: string) => void;
}

const Signin: React.FC<SigninProps> = ({ onSuccess: onLoginSuccess }) => {
  const { setIsAuthenticated } = useAuthContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  // Employee mode signs in through POST employee/login (rejects non-employee accounts with 403)
  const [loginAs, setLoginAs] = useState<'admin' | 'employee'>('admin');
  const isEmployeeLogin = loginAs === 'employee';

  interface SignInPayload { username: string; password: string; }

  useEffect(() => {
    if (formSubmitted || password) validatePassword(password);
  }, [password, formSubmitted]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SignInPayload) => {
      const response = isEmployeeLogin ? await employeeLogin(data) : await api.post('/users/login', data);
      return response;
    },
    onSuccess: (data: any) => {
      const tokenData = data?.data || data;
      // The employee's panel (portal) is loaded again from employee/profile after login
      setEmployeePortal(null);
      localStorage.setItem('token', JSON.stringify(tokenData));
      localStorage.setItem('token_key', JSON.stringify(tokenData));
      if (tokenData?.accessToken) {
        localStorage.setItem('accessToken', tokenData.accessToken);
      }
      setIsAuthenticated(true);
      const role = tokenData?.user?.role || tokenData?.role || '';
      toast.success('Logged in successfully');
      if (onLoginSuccess) onLoginSuccess(role);
    },
    onError: (error: AxiosError<any>) => {
      // Expired plan: the Plan expired popup shows instead of a toast
      if (error.response?.data?.data?.code === 'PLAN_EXPIRED') return;
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message === 'Validation failed' ? 'Invalid credentials. Please check your details.' : message);
    },
  });

  const isEmailInput = (val: string) => val.includes('@') || /[a-zA-Z]/.test(val);

  const validateIdentifier = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setPhoneError('Mobile number or email is required');
      return false;
    }
    if (isEmailInput(trimmed)) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setPhoneError('Please enter a valid email address');
        return false;
      }
      setPhoneError('');
      return true;
    }
    const cleaned = trimmed.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleaned)) {
      setPhoneError('Please enter exactly 10 digits');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validatePassword = (pass: string): boolean => {
    if (!pass.trim()) { setPasswordError('Password is required'); return false; }
    if (pass.length < 6) { setPasswordError('At least 6 characters required'); return false; }
    setPasswordError(''); return true;
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    if (val && formSubmitted) validateIdentifier(val);
    else if (!val) setPhoneError('');
  };

  const handleSignIn = () => {
    setFormSubmitted(true);
    if (!validateIdentifier(username) || !validatePassword(password)) return;
    const loginIdentifier = isEmailInput(username) ? username.trim() : username.replace(/\D/g, '');
    mutate({ username: loginIdentifier, password });
  };

  const canSubmit = () => {
    const isEmail = isEmailInput(username);
    const validId = isEmail ? username.trim().length >= 5 : username.replace(/\D/g, '').length === 10;
    return !isPending && validId && password.length >= 6 && !phoneError && !passwordError;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#f0f7ff] via-white to-[#e8f1fc] p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-[#2563EB] via-[#60A5FA] to-[#2563EB]" />

          <div className="px-8 py-9 sm:px-10">
            {/* Icon + Heading */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#2563EB]/10 ring-2 ring-[#2563EB]/20 flex items-center justify-center">
                <svg className="h-7 w-7 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
              <p className="mt-1 text-sm text-gray-500">Enter your credentials to continue</p>
            </div>

            {/* Login as: Admin / Employee */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1" role="tablist" aria-label="Login as">
              {(['admin', 'employee'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={loginAs === mode}
                  onClick={() => setLoginAs(mode)}
                  className={`h-9 rounded-lg text-sm font-semibold transition-all ${
                    loginAs === mode ? 'bg-white text-[#2563EB] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode === 'admin' ? 'Admin' : 'Employee'}
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-5">
              {/* Mobile or Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">{isEmployeeLogin ? 'Mobile Number' : 'Mobile Number or Email'}</label>
                <input
                  type="text"
                  placeholder="10-digit mobile or email address"
                  value={username}
                  onChange={handleIdentifierChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                  className={`h-11 w-full rounded-xl border px-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-[#2563EB]/25 ${
                    phoneError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-[#2563EB]'
                  }`}
                />
                {phoneError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {phoneError}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                    className={`h-11 w-full rounded-xl border px-4 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-[#2563EB]/25 ${
                      passwordError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-[#2563EB]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-[#2563EB] transition-colors"
                  >
                    {passwordVisible ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isPending}
                className={`mt-1 h-12 w-full rounded-xl text-base font-bold text-white transition-all shadow-md ${
                  isPending
                    ? 'cursor-not-allowed bg-[#2563EB]/60'
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] shadow-[#2563EB]/25'
                }`}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
