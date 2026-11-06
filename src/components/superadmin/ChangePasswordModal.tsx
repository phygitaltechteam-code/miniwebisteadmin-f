import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useChangeMyEmployeePassword } from '@/lib/react-query/employee/auth';

/** Employee: change own password (POST employee/change-password) */
export const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { mutate, isPending } = useChangeMyEmployeePassword(onClose);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return setError('Please fill in every field');
    if (newPassword.length < 6) return setError('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('New passwords do not match');
    if (newPassword === currentPassword) return setError('New password must be different from the current one');
    setError('');
    mutate({ currentPassword, newPassword });
  };

  const field = (label: string, value: string, set: (v: string) => void, autoComplete: string) => (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-[13px] font-medium text-[#424242]">{label}</span>
      <input
        type="password"
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => set(e.target.value)}
        className="h-10 w-full rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] px-3 text-sm outline-none focus:border-[#2196F3] focus:ring-2 focus:ring-[#2196F3]/20"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-[380px] p-6 flex flex-col gap-4 font-['Roboto',Helvetica,Arial,sans-serif]"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-[#2196F3]" />
          </div>
          <p className="text-[17px] font-semibold text-[#212121]">Change password</p>
        </div>
        {field('Current password', currentPassword, setCurrentPassword, 'current-password')}
        {field('New password', newPassword, setNewPassword, 'new-password')}
        {field('Confirm new password', confirmPassword, setConfirmPassword, 'new-password')}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-3 w-full mt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[#E0E0E0] text-[14px] font-medium text-[#424242] hover:bg-[#F5F5F5] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-2.5 rounded-lg bg-[#2196F3] text-white text-[14px] font-medium hover:bg-[#1976D2] disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Saving…' : 'Change'}
          </button>
        </div>
      </form>
    </div>
  );
};
