import React, { useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Centered confirmation popup (used before deleting); Esc or backdrop click cancels */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Yes, Delete',
  busy = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => !busy && onCancel()} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[360px] p-6 flex flex-col items-center gap-4 font-['Roboto',Helvetica,Arial,sans-serif]">
        <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
          <Trash2 className="w-7 h-7 text-rose-500" />
        </div>
        <div className="text-center">
          <p className="text-[17px] font-semibold text-[#212121] leading-snug">{title}</p>
          <p className="text-[13px] text-[#757575] mt-1 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 w-full mt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2.5 rounded-lg border border-[#E0E0E0] text-[14px] font-medium text-[#424242] hover:bg-[#F5F5F5] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-2.5 rounded-lg bg-rose-500 text-white text-[14px] font-medium hover:bg-rose-600 transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
