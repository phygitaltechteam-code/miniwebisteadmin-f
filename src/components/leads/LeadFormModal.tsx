import React, {useEffect, useMemo, useState} from 'react';
import {Loader2, Star, X, AlertTriangle, UserCheck} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LEAD_FIELDS,
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  type LeadFieldKey,
  type LeadInput,
  type LeadStatus,
} from '@/types/lead';
import {utcDay} from '@/lib/leads/dates';
import useDebounce from '@/hooks/useDebounce';
import PlatformMatchBadge from './PlatformMatchBadge';

export interface LeadFormModalProps {
  initial?: Partial<LeadInput>;
  /** Field keys the scanner is unsure about: shown with an amber outline until edited. */
  uncertain?: Set<string>;
  /** Why a field is uncertain, by field key. */
  reasons?: Record<string, string>;
  /** OCR lines shown as chips: focus a field, then tap a line to fill it (or tap a line, then a field). */
  ocrLines?: string[];
  title?: string;
  submitting?: boolean;
  /**
   * Receives the edited form fields only (the 14 contact fields, event, status, priority,
   * followUpAt as 'YYYY-MM-DD' or null, starred). Blank text fields are sent as ''.
   */
  onSubmit: (values: LeadInput) => void | Promise<void>;
  onClose: () => void;
  /** Rendered above the action buttons. */
  extra?: React.ReactNode;
  /** Known event names, offered as suggestions. */
  events?: string[];
  /** Business the lead belongs to (super admin / franchise); the owner's own when not set. */
  adminId?: string;
  /** Show whether the lead's business is already on digiwebcard (default true). */
  platformMatch?: boolean;
  /**
   * Shows a "Move to customers" button; receives the current form values (validated like Save),
   * so edits can be saved before the lead becomes a customer.
   */
  onMoveToCustomer?: (values: LeadInput) => void | Promise<void>;
  movingToCustomer?: boolean;
}

type TextState = Record<LeadFieldKey, string>;

const CONTACT_KEYS: LeadFieldKey[] = [
  'name',
  'company',
  'mobile',
  'officePhone',
  'otherPhone',
  'email',
  'email2',
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialText = (initial?: Partial<LeadInput>): TextState =>
  LEAD_FIELDS.reduce((acc, f) => {
    acc[f.key] = (initial?.[f.key] as string | null | undefined) ?? '';
    return acc;
  }, {} as TextState);

const LeadFormModal: React.FC<LeadFormModalProps> = ({
  initial,
  uncertain,
  reasons,
  ocrLines,
  title = 'Lead',
  submitting = false,
  onSubmit,
  onClose,
  extra,
  events,
  adminId,
  platformMatch = true,
  onMoveToCustomer,
  movingToCustomer = false,
}) => {
  const [text, setText] = useState<TextState>(() => initialText(initial));
  const [event, setEvent] = useState(initial?.event ?? '');
  const [status, setStatus] = useState<LeadStatus>(initial?.status ?? 'NEW');
  const [priority, setPriority] = useState<number>(initial?.priority ?? 0);
  const [followUpAt, setFollowUpAt] = useState(utcDay(initial?.followUpAt));
  const [starred, setStarred] = useState(!!initial?.starred);
  const [edited, setEdited] = useState<Set<string>>(() => new Set());
  const [focusedField, setFocusedField] = useState<LeadFieldKey | null>(null);
  const [pendingLine, setPendingLine] = useState<string | null>(null);

  const lines = useMemo(
    () => (ocrLines || []).map((l) => l.trim()).filter(Boolean),
    [ocrLines],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitting, onClose]);

  const setField = (key: LeadFieldKey, value: string) => {
    setText((prev) => ({...prev, [key]: value}));
    setEdited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  };

  /** Puts an OCR line into a field: appended on a new line for address/notes, after a comma for other phones. */
  const fillFromLine = (key: LeadFieldKey, line: string) => {
    const type = LEAD_FIELDS.find((f) => f.key === key)?.type;
    const current = text[key].trim();
    let next = line;
    if (current && type === 'multiline') next = `${current}\n${line}`;
    else if (current && key === 'otherPhone') next = `${current}, ${line}`;
    setField(key, next);
  };

  const onLineClick = (line: string) => {
    if (focusedField) {
      fillFromLine(focusedField, line);
      setPendingLine(null);
    } else {
      setPendingLine((prev) => (prev === line ? null : line));
    }
  };

  const onFieldFocus = (key: LeadFieldKey) => {
    setFocusedField(key);
    if (pendingLine) {
      fillFromLine(key, pendingLine);
      setPendingLine(null);
    }
  };

  // Platform match follows what is typed, after a pause
  const matchPhone = useDebounce(
    text.mobile.trim() ||
      text.otherPhone.split(',')[0].trim() ||
      text.officePhone.trim(),
    600,
  );
  const matchCompany = useDebounce(text.company.trim(), 600);
  const busy = submitting || movingToCustomer;

  /** The edited values, or null (with a toast) when they can't be saved. */
  const collect = (): LeadInput | null => {
    const trimmed = LEAD_FIELDS.reduce((acc, f) => {
      acc[f.key] = text[f.key].trim();
      return acc;
    }, {} as TextState);
    if (!CONTACT_KEYS.some((k) => trimmed[k])) {
      toast.error('Add at least a name, company, phone or email.');
      return null;
    }
    const badEmail = (['email', 'email2'] as const).find(
      (k) => trimmed[k] && !EMAIL_RE.test(trimmed[k]),
    );
    if (badEmail) {
      toast.error(
        `${badEmail === 'email' ? 'Email' : 'Email 2'} doesn't look like an email address.`,
      );
      return null;
    }
    return {
      ...trimmed,
      event: event.trim(),
      status,
      priority,
      followUpAt: followUpAt || null,
      starred,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const values = collect();
    if (values) await onSubmit(values);
  };

  const handleMoveToCustomer = async () => {
    if (busy || !onMoveToCustomer) return;
    const values = collect();
    if (values) await onMoveToCustomer(values);
  };

  const isUncertain = (key: string) =>
    !!uncertain?.has(key) && !edited.has(key);

  const boxClass = (key: string) =>
    `relative rounded border bg-white transition-all ${
      isUncertain(key)
        ? 'border-amber-400 ring-1 ring-amber-300 focus-within:border-amber-500'
        : 'border-[#D1D5DB] focus-within:border-[#2196F3] focus-within:ring-1 focus-within:ring-[#2196F3]'
    }`;
  const inputClass =
    'w-full px-3 py-2.5 text-sm font-medium text-[#212121] placeholder:text-[#9CA3AF] bg-transparent focus:outline-none';
  const floatLabelClass =
    'absolute -top-2.5 left-2.5 px-1 bg-white text-[11px] font-medium text-[#4B5563]';
  const plainLabel = 'block text-[11px] font-medium text-[#4B5563] mb-1';
  const selectClass =
    'w-full rounded border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm font-medium text-[#212121] focus:outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]';

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-3 font-['Roboto',Helvetica,Arial,sans-serif] sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[94vh] w-full max-w-[760px] flex-col rounded-lg bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 pb-3 pt-5">
          <h2 className="text-[19px] font-bold text-[#212121]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md p-1 text-[#9CA3AF] transition-colors hover:text-[#374151] disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          {platformMatch && (matchPhone || matchCompany) && (
            <div className="-mb-1 flex min-w-0">
              <PlatformMatchBadge
                phone={matchPhone}
                company={matchCompany}
                adminId={adminId}
              />
            </div>
          )}
          {lines.length > 0 && (
            <div className="rounded-lg border border-[#E3F2FD] bg-[#F7FBFF] p-3">
              <p className="mb-2 text-[12px] text-[#546E7A]">
                {pendingLine
                  ? 'Now tap the field this line belongs to.'
                  : 'Text read from the card: click a field, then a line to fill it.'}
              </p>
              <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                {lines.map((line, i) => (
                  <button
                    key={`${i}-${line}`}
                    type="button"
                    // Keep focus on the field so the line goes into it
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onLineClick(line)}
                    className={`max-w-full truncate rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                      pendingLine === line
                        ? 'border-[#2196F3] bg-[#2196F3] text-white'
                        : 'border-[#BBDEFB] bg-white text-[#1565C0] hover:bg-[#E3F2FD]'
                    }`}
                    title={line}
                  >
                    {line}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-3 gap-y-4 pt-1 sm:grid-cols-2">
            {LEAD_FIELDS.map((f) => {
              const multiline = f.type === 'multiline';
              const common = {
                id: `lead-${f.key}`,
                value: text[f.key],
                onFocus: () => onFieldFocus(f.key),
                onBlur: () =>
                  setFocusedField((prev) => (prev === f.key ? null : prev)),
                className: inputClass,
              };
              return (
                <div key={f.key} className={multiline ? 'sm:col-span-2' : ''}>
                  <div className={boxClass(f.key)}>
                    <label
                      htmlFor={`lead-${f.key}`}
                      className={floatLabelClass}
                    >
                      {f.label}
                    </label>
                    {multiline ? (
                      <textarea
                        {...common}
                        rows={2}
                        onChange={(e) => setField(f.key, e.target.value)}
                        className={`${inputClass} min-h-[56px] resize-y`}
                      />
                    ) : (
                      <input
                        {...common}
                        type={
                          f.type === 'email'
                            ? 'email'
                            : f.type === 'phone'
                              ? 'tel'
                              : 'text'
                        }
                        inputMode={
                          f.type === 'phone'
                            ? 'tel'
                            : f.type === 'email'
                              ? 'email'
                              : f.type === 'url'
                                ? 'url'
                                : undefined
                        }
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    )}
                  </div>
                  {isUncertain(f.key) && (
                    <p className="mt-1 flex items-start gap-1 text-[11px] text-amber-700">
                      <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                      <span>
                        {reasons?.[f.key] || 'Please check this field.'}
                      </span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-[#F3F4F6] pt-4 sm:grid-cols-4">
            <div className="col-span-2">
              <label htmlFor="lead-event" className={plainLabel}>
                Event
              </label>
              <input
                id="lead-event"
                list="lead-event-options"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="e.g. Pune Expo 2026"
                className={selectClass}
              />
              {!!events?.length && (
                <datalist id="lead-event-options">
                  {events.map((ev) => (
                    <option key={ev} value={ev} />
                  ))}
                </datalist>
              )}
            </div>
            <div>
              <label htmlFor="lead-status" className={plainLabel}>
                Status
              </label>
              <select
                id="lead-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className={selectClass}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lead-priority" className={plainLabel}>
                Priority
              </label>
              <select
                id="lead-priority"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className={selectClass}
              >
                {LEAD_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <label htmlFor="lead-followup" className={plainLabel}>
                Follow-up date
              </label>
              <div className="flex gap-2">
                <input
                  id="lead-followup"
                  type="date"
                  value={followUpAt}
                  onChange={(e) => setFollowUpAt(e.target.value)}
                  className={selectClass}
                />
                {followUpAt && (
                  <button
                    type="button"
                    onClick={() => setFollowUpAt('')}
                    className="shrink-0 px-2 text-[12px] text-[#6B7280] hover:text-[#1F2937]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="col-span-2 flex items-end">
              <button
                type="button"
                onClick={() => setStarred((s) => !s)}
                aria-pressed={starred}
                className={`flex items-center gap-2 rounded border px-3 py-2.5 text-sm font-medium transition-colors ${
                  starred
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-[#D1D5DB] text-[#4B5563] hover:bg-[#F9FAFB]'
                }`}
              >
                <Star
                  className={`h-4 w-4 ${starred ? 'fill-amber-400 text-amber-500' : ''}`}
                />
                {starred ? 'Starred' : 'Star this lead'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#F3F4F6] px-5 py-4">
          {extra}
          <div className="flex flex-wrap items-center justify-end gap-3">
            {onMoveToCustomer && (
              <button
                type="button"
                onClick={handleMoveToCustomer}
                disabled={busy}
                className="mr-auto flex items-center gap-1.5 rounded-lg border border-[#C8E6C9] bg-[#E8F5E9] px-4 py-2.5 text-[14px] font-medium text-[#2E7D32] transition-colors hover:bg-[#C8E6C9] disabled:opacity-60"
                title="Save the lead, mark it Won and add it to Customers"
              >
                {movingToCustomer ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                Move to customers
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-[#E0E0E0] px-5 py-2.5 text-[14px] font-medium text-[#424242] transition-colors hover:bg-[#F5F5F5] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg bg-[#2196F3] px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1E88E5] disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Saving…' : 'Save lead'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LeadFormModal;
