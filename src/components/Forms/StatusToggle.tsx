import React, { useState } from 'react';
import { Power } from 'lucide-react';

interface StatusToggleProps {
  active: boolean;
  /** Called only after the user confirms in the popup */
  onToggle: () => void | Promise<void>;
  disabled?: boolean;
  /** Shown in the confirmation popup, e.g. the business or franchise name */
  name?: string;
}

/**
 * Small on/off switch with an Active / Inactive label, used in the admin and franchise tables.
 * Clicking it first asks for confirmation; the switch itself always shows `active` from the caller.
 */
export const StatusToggle: React.FC<StatusToggleProps> = ({ active, onToggle, disabled, name }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const action = active ? 'Deactivate' : 'Activate';

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onToggle();
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1.5 no-row-click" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={active ? 'Active' : 'Inactive'}
        disabled={disabled || busy}
        onClick={() => setConfirmOpen(true)}
        title={active ? 'Click to deactivate' : 'Click to activate'}
        // Inline colors + border so table/button styles can't hide the track in the off state
        style={{
          backgroundColor: active ? '#4CAF50' : '#BDBDBD',
          border: `1px solid ${active ? '#43A047' : '#9E9E9E'}`,
        }}
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0 transition-colors disabled:opacity-50 disabled:cursor-wait"
      >
        <span
          style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
          className={`inline-block h-4 w-4 rounded-full transition-transform ${
            active ? 'translate-x-[17px]' : 'translate-x-[1px]'
          }`}
        />
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => !busy && setConfirmOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-[340px] p-6 flex flex-col items-center gap-4 font-['Roboto',Helvetica,Arial,sans-serif]">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${active ? 'bg-rose-50' : 'bg-emerald-50'}`}>
              <Power className={`w-7 h-7 ${active ? 'text-rose-500' : 'text-emerald-600'}`} />
            </div>
            <div className="text-center">
              <p className="text-[17px] font-semibold text-[#212121] leading-snug">{action}?</p>
              <p className="text-[13px] text-[#757575] mt-1 leading-relaxed whitespace-normal">
                Are you sure you want to {action.toLowerCase()} {name ? <strong className="text-[#212121]">{name}</strong> : 'this account'}?
              </p>
            </div>
            <div className="flex gap-3 w-full mt-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#E0E0E0] text-[14px] font-medium text-[#424242] hover:bg-[#F5F5F5] transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleConfirm}
                className={`flex-1 py-2.5 rounded-lg text-white text-[14px] font-medium transition-colors disabled:opacity-60 ${
                  active ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {busy ? 'Please wait...' : `Yes, ${action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusToggle;
