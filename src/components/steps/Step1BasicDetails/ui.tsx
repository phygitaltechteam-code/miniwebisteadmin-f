import React from 'react';
import { Plus } from 'lucide-react';

export const PREFIX_OPTIONS = ['None', 'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.', 'Adv.', 'Prof.'];

/** Grey card that wraps each part of Basic Details */
export const CARD_CLASS = 'p-2.5 sm:p-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] space-y-2.5';

export const SELECT_CLASS =
  "w-full h-9 px-2 rounded border border-[#C4C4C4] bg-white text-[13px] sm:text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none";

export const TEXT_INPUT_CLASS =
  "text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]";

/** Section heading (icon + uppercase title) */
export const CardTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <h3 className="text-[13px] font-bold text-[#091426] uppercase tracking-wider flex items-center gap-1.5">
    {icon}
    {children}
  </h3>
);

/** Blue "Add …" button with the (count/3) counter */
export const AddMoreButton: React.FC<{ label: string; count: number; onClick: () => void }> = ({ label, count, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={count >= 3}
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#2196F3] text-white text-[13px] font-medium hover:bg-[#1E88E5] transition-colors disabled:opacity-50"
  >
    <Plus className="w-3.5 h-3.5" />
    <span>{label}</span>
    <span className="text-[11px] opacity-80 ml-0.5">({count}/3)</span>
  </button>
);

/** Prefix select (None, Mr., Mrs., …) */
export const PrefixSelect: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <>
    <label className="block text-[13px] sm:text-[14px] font-normal text-[#000000DE] mb-1 truncate">
      Prefix
    </label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
      {PREFIX_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </>
);
