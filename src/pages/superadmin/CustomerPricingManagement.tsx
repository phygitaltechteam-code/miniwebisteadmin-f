import React, { useState } from 'react';
import {
  Check,
  Edit2,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isFranchiseScope } from '@/utils/axios';
import {
  createPlan,
  deletePlan,
  getPlans,
  planErrorText,
  updatePlan,
  PlanAudience,
  PlanFeatureGroup,
  PlanItem,
  PlanPayload,
  PlanValidityUnit,
} from '@/lib/api/superadmin/plan';

export type ValidityUnit = 'Year' | 'Month' | 'Day';

// Main plan tiers offered in the plan name dropdown; 'Other' lets the user type a custom name
export const PLAN_TIERS = ['Silver', 'Gold', 'Platinum'];
export const OTHER_PLAN = 'Other';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** yyyy-mm-ddThh:mm:ss in local time (what <input type="datetime-local" step="1"> uses) */
const toDateTimeInput = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

const nowInput = () => toDateTimeInput(new Date());

/** Local date-time input value (seconds optional; a bare yyyy-mm-dd is midnight) as a Date */
const parseInput = (value: string) => new Date(value.length === 10 ? `${value}T00:00:00` : value);

/** Input value as an ISO timestamp for the API */
export const inputToIso = (value: string) => {
  const d = parseInput(value);
  return isNaN(d.getTime()) ? value : d.toISOString();
};

/** `from` plus `count` units, same time of day */
const addValidity = (from: string, unit: ValidityUnit, count = 1): string => {
  const d = parseInput(from);
  if (unit === 'Year') d.setFullYear(d.getFullYear() + count);
  else if (unit === 'Month') d.setMonth(d.getMonth() + count);
  else d.setDate(d.getDate() + count);
  return toDateTimeInput(d);
};

/** Whole units between two dates (at least 1) — e.g. 2026-01-01 → 2029-01-01 in Year = 3 */
const validityCount = (from: string, to: string, unit: ValidityUnit): number => {
  const a = parseInput(from);
  const b = parseInput(to);
  if (isNaN(a.getTime()) || isNaN(b.getTime()) || b <= a) return 1;
  if (unit === 'Day') return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
  const months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  return Math.max(1, unit === 'Year' ? Math.round(months / 12) : months);
};

/** 29 Oct 2026, 15:20:05 */
export const formatDisplayDateTime = (value?: string) => {
  if (!value) return '';
  const d = value.includes('T') && !/[zZ]|[+-]\d\d:\d\d$/.test(value) ? parseInput(value) : new Date(value);
  return isNaN(d.getTime())
    ? value
    : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

interface ValidityDatesProps {
  unit: ValidityUnit;
  count: number;
  from: string;
  to: string;
  onUnitChange: (unit: ValidityUnit) => void;
  onCountChange: (count: number) => void;
  onFromChange: (from: string) => void;
  onToChange: (to: string) => void;
}

/**
 * Validity unit + number of units + From / To dates.
 * To = From + number × unit (same day and month, e.g. 2 Years from 29/10/2026 → 29/10/2028); To can still be edited.
 */
export const ValidityDates: React.FC<ValidityDatesProps> = ({ unit, count, from, to, onUnitChange, onCountChange, onFromChange, onToChange }) => {
  const fieldClass =
    'w-full rounded border border-gray-300 px-3.5 pt-3 pb-2 text-[14px] text-gray-800 bg-white focus:border-[#2196F3] focus:outline-none';
  const labelClass = 'absolute left-3 top-1 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <select value={unit} onChange={(e) => onUnitChange(e.target.value as ValidityUnit)} className={fieldClass}>
            <option value="Year">Year</option>
            <option value="Month">Month</option>
            <option value="Day">Day</option>
          </select>
          <label className={labelClass}>Validity unit</label>
        </div>
        <div className="relative">
          <input
            type="number"
            min={1}
            step={1}
            value={count || ''}
            onChange={(e) => onCountChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            required
            className={fieldClass}
          />
          <label className={labelClass}>Number of {unit.toLowerCase()}s *</label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <input type="datetime-local" step={1} value={from} onChange={(e) => onFromChange(e.target.value)} required className={fieldClass} />
          <label className={labelClass}>From date & time *</label>
        </div>
        <div className="relative">
          <input type="datetime-local" step={1} value={to} min={from} onChange={(e) => onToChange(e.target.value)} required className={fieldClass} />
          <label className={labelClass}>To date & time *</label>
        </div>
      </div>
      <p className="text-[12px] text-gray-500">
        Validity: {count || 0} {unit}
        {count > 1 ? 's' : ''} ({formatDisplayDateTime(from)} – {formatDisplayDateTime(to)})
      </p>
    </div>
  );
};

/** State + handlers for one ValidityDates field group (the number typed decides To from From) */
export const useValidityDates = () => {
  const [unit, setUnit] = useState<ValidityUnit>('Year');
  const [count, setCount] = useState(1);
  const [from, setFrom] = useState(nowInput);
  const [to, setTo] = useState(() => addValidity(nowInput(), 'Year'));

  return {
    unit,
    from,
    to,
    count,
    onUnitChange: (u: ValidityUnit) => {
      setUnit(u);
      setTo(addValidity(from, u, count || 1));
    },
    onCountChange: (n: number) => {
      setCount(n);
      if (n > 0) setTo(addValidity(from, unit, n));
    },
    onFromChange: (f: string) => {
      if (!f) return;
      setFrom(f);
      setTo(addValidity(f, unit, count || 1));
    },
    onToChange: (t: string) => {
      if (!t) return;
      // A hand-picked To date updates the number when it is a whole number of units
      setTo(t);
      setCount(validityCount(from, t, unit));
    },
    /** Use a plan's length: From stays, To = From + count × unit */
    applyLength: (u: ValidityUnit, n: number) => {
      setUnit(u);
      setCount(n);
      setTo(addValidity(from, u, n || 1));
    },
    /** Start again from now with the given length (default 1 Year) */
    reset: (u: ValidityUnit = 'Year', n = 1) => {
      const start = nowInput();
      setUnit(u);
      setCount(n);
      setFrom(start);
      setTo(addValidity(start, u, n));
    },
  };
};

/** UI unit (Year / Month / Day) ↔ API unit (YEAR / MONTH / DAY) */
export const toApiUnit = (unit: ValidityUnit): PlanValidityUnit => unit.toUpperCase() as PlanValidityUnit;
export const fromApiUnit = (unit?: string): ValidityUnit => {
  const u = String(unit || 'YEAR').toUpperCase();
  return u === 'DAY' ? 'Day' : u === 'MONTH' ? 'Month' : 'Year';
};

export const formatPlanValidity = (value: number, unit?: string) => {
  const u = fromApiUnit(unit);
  return `${value} ${u}${value > 1 ? 's' : ''}`;
};

/** Feature list built from the plan form fields (sent as `features`) */
const buildFeatures = (f: { digitalCards: number; unlimitedGreetingImages: boolean; greetingVideosPerDay: number; aiCredits: number }): PlanFeatureGroup[] => {
  const card = [`${f.digitalCards} digital card${f.digitalCards > 1 ? 's' : ''}`, 'Change theme anytime', 'Edit details anytime'];
  const greetings = [
    ...(f.unlimitedGreetingImages ? ['Download unlimited images'] : []),
    ...(f.greetingVideosPerDay > 0 ? [`Download ${f.greetingVideosPerDay} videos per day`] : []),
  ];
  return [
    { group: 'Digital Card', items: card },
    ...(greetings.length ? [{ group: 'Greetings', items: greetings }] : []),
    ...(f.aiCredits > 0 ? [{ group: 'AI', items: [`${f.aiCredits} AI credits`] }] : []),
  ];
};

/** Features saved on the plan, or built from its fields when none were saved */
export const planFeatures = (plan: PlanItem): PlanFeatureGroup[] =>
  plan.features?.length ? plan.features : buildFeatures(plan);

/** One plan card (used on the plans page and in the select-plan popup) */
export const PlanCard: React.FC<{ plan: PlanItem; footer?: React.ReactNode; actions?: React.ReactNode; selected?: boolean; onClick?: () => void }> = ({
  plan,
  footer,
  actions,
  selected,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`flex flex-col rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow relative ${
      selected ? 'border-[#2196F3] ring-2 ring-[#2196F3]/30' : 'border-gray-200'
    } ${onClick ? 'cursor-pointer' : ''} ${plan.isActive ? '' : 'opacity-70'}`}
  >
    <div className="rounded-md bg-[#2196F3] px-3 py-2 text-center text-white font-medium text-[14px] leading-tight min-h-[44px] flex items-center justify-center">
      {plan.name}
    </div>

    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 min-h-[8px]">
      {plan.isFreeTrial && <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Free trial</span>}
      {!plan.isActive && <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600">Inactive</span>}
      {plan.franchise && (
        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
          {plan.franchise.fullname || plan.franchise.name}
        </span>
      )}
    </div>

    <div className="my-3 rounded border border-gray-200 bg-gray-50/80 p-2.5 text-center">
      <div className="text-[20px] font-bold text-[#212121]">{plan.isFreeTrial ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}/-`}</div>
      <div className="text-[12px] text-gray-600 font-medium">Validity: {formatPlanValidity(plan.validityValue, plan.validityUnit)}</div>
    </div>

    <div className="space-y-3 text-[13px] flex-1 pb-3">
      {planFeatures(plan).map((g) => (
        <div key={g.group} className="space-y-1.5">
          <div className="font-bold text-[#212121]">{g.group}</div>
          {g.items.map((item) => (
            <div key={item} className="flex items-start gap-1.5 text-gray-700">
              <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      ))}
    </div>

    {plan.usedBy !== undefined && (
      <div className="pb-2 text-[12px] text-gray-500 text-center">
        Used by {plan.usedBy} {plan.usedBy === 1 ? 'account' : 'accounts'}
      </div>
    )}
    {actions}
    {footer}
  </div>
);

/** Add / edit plan form values */
interface PlanFormState {
  isFreeTrial: boolean;
  tier: string;
  customName: string;
  price: string;
  digitalCards: number;
  includeImages: boolean;
  includeVideos: boolean;
  videosPerDay: number;
  includeAi: boolean;
  aiCredits: number;
  isActive: boolean;
}

const emptyForm = (): PlanFormState => ({
  isFreeTrial: false,
  tier: PLAN_TIERS[0],
  customName: '',
  price: '',
  digitalCards: 1,
  includeImages: true,
  includeVideos: true,
  videosPerDay: 3,
  includeAi: false,
  aiCredits: 50,
  isActive: true,
});

const formFromPlan = (p: PlanItem): PlanFormState => ({
  isFreeTrial: p.isFreeTrial,
  tier: PLAN_TIERS.includes(p.name) ? p.name : OTHER_PLAN,
  customName: PLAN_TIERS.includes(p.name) ? '' : p.name,
  price: String(p.price ?? ''),
  digitalCards: p.digitalCards || 1,
  includeImages: p.unlimitedGreetingImages,
  includeVideos: p.greetingVideosPerDay > 0,
  videosPerDay: p.greetingVideosPerDay || 3,
  includeAi: p.aiCredits > 0,
  aiCredits: p.aiCredits || 50,
  isActive: p.isActive,
});

export const CustomerPricingManagement: React.FC = () => {
  const isFranchise = isFranchiseScope();
  const queryClient = useQueryClient();

  // SuperAdmin: its own business plans and franchise plans (one tab each). Franchise: its own business plans only.
  const [audience, setAudience] = useState<PlanAudience>('ADMIN');

  const { data: plans = [], isLoading, isError, error } = useQuery({
    queryKey: ['plans', isFranchise ? 'franchise' : 'superAdmin', audience],
    queryFn: () => getPlans(isFranchise ? {} : { audience }),
  });
  const refreshPlans = () => queryClient.invalidateQueries({ queryKey: ['plans'] });

  // Add / edit modal (editingId null = new plan)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormState>(emptyForm);
  // Validity: unit + number + From / To date-time (To = From + number × unit)
  const planDates = useValidityDates();
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const set = <K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const openNew = (custom = false) => {
    setEditingId(null);
    setForm(custom ? { ...emptyForm(), tier: OTHER_PLAN, customName: 'Custom' } : emptyForm());
    planDates.reset();
    setShowForm(true);
  };
  const openEdit = (plan: PlanItem) => {
    setEditingId(plan.id);
    setForm(formFromPlan(plan));
    planDates.reset(fromApiUnit(plan.validityUnit), plan.validityValue);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.tier === OTHER_PLAN ? form.customName.trim() : form.tier;
    if (!name) {
      toast.error('Please enter plan name');
      return;
    }
    if (planDates.count < 1 || planDates.to <= planDates.from) {
      toast.error('Enter the number of years / months / days (1 or more)');
      return;
    }
    if (!form.isFreeTrial && form.price === '') {
      toast.error('Please enter price');
      return;
    }
    const fields = {
      digitalCards: 1,
      unlimitedGreetingImages: form.includeImages,
      greetingVideosPerDay: form.includeVideos ? Math.max(0, form.videosPerDay) : 0,
      aiCredits: form.includeAi ? Math.max(0, form.aiCredits) : 0,
    };
    const payload: PlanPayload = {
      audience,
      name,
      isFreeTrial: form.isFreeTrial,
      validityUnit: toApiUnit(planDates.unit),
      validityValue: planDates.count,
      price: form.isFreeTrial ? 0 : Number(form.price) || 0,
      ...fields,
      isActive: form.isActive,
      features: buildFeatures(fields),
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await updatePlan(editingId, payload);
        toast.success('Plan updated');
      } else {
        await createPlan(payload);
        toast.success('Subscription plan added');
      }
      closeForm();
      refreshPlans();
    } catch (err) {
      toast.error(planErrorText(err, 'Failed to save plan'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (plan: PlanItem) => {
    const note = plan.usedBy ? ` ${plan.usedBy} account(s) on it keep their current plan.` : '';
    if (!window.confirm(`Delete plan "${plan.name}"?${note}`)) return;
    setDeletingId(plan.id);
    try {
      await deletePlan(plan.id);
      toast.success('Plan deleted');
      refreshPlans();
    } catch (err) {
      toast.error(planErrorText(err, 'Failed to delete plan'));
    } finally {
      setDeletingId(null);
    }
  };

  const fieldClass =
    'w-full rounded border border-gray-300 px-3.5 pt-3 pb-2 text-[14px] text-gray-800 bg-white focus:border-[#2196F3] focus:outline-none';
  const labelClass = 'absolute left-3 top-1 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500';
  const checkClass = 'h-4 w-4 rounded border-gray-300 text-[#2196F3] focus:ring-[#2196F3]';
  const tabClass = (active: boolean) =>
    `pb-2.5 text-[14px] font-medium border-b-2 transition-colors ${active ? 'border-[#2196F3] text-[#2196F3]' : 'border-transparent text-gray-600 hover:text-black'}`;

  return (
    <div className="w-full space-y-6 font-['Roboto',Helvetica,Arial,sans-serif]">
      <div className="pb-2 border-b border-[#E0E0E0]">
        <h2 className="text-[18px] font-medium text-[#212121]">Customer Plans & Pricing</h2>
        <p className="text-[12px] text-gray-500">
          {isFranchise ? 'Plans for your businesses' : 'Plans for businesses and franchises'}
        </p>
      </div>

      {/* Tabs (SuperAdmin only); the add button adds a plan to the open tab */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E0E0E0]">
        <div className="flex gap-8">
          {isFranchise ? (
            <span className={tabClass(true)}>Business plans</span>
          ) : (
            <>
              <button type="button" onClick={() => setAudience('ADMIN')} className={tabClass(audience === 'ADMIN')}>
                Business plans
              </button>
              <button type="button" onClick={() => setAudience('FRANCHISE')} className={tabClass(audience === 'FRANCHISE')}>
                Franchise plans
              </button>
            </>
          )}
        </div>
        {/* Franchise plans tab only lists the plans (no add button) */}
        {(isFranchise || audience === 'ADMIN') && (
        <button
          type="button"
          onClick={() => openNew()}
          className="mb-2 flex items-center gap-1.5 rounded bg-[#2196F3] hover:bg-[#1E88E5] px-4 py-1.5 text-[13px] font-medium text-white shadow-none transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add business plan
        </button>
        )}
      </div>

      <div className="text-center pt-2">
        <h1 className="text-[22px] font-bold text-[#212121]">Choose your plan</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[14px] text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading plans…
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-[14px] text-red-600">{planErrorText(error, 'Failed to load plans')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch pt-2">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              footer={
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openEdit(plan)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded bg-gradient-to-r from-[#FF7043] to-[#FF5722] hover:opacity-95 text-white py-2 text-[13px] font-bold uppercase tracking-wider shadow-sm transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit plan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(plan)}
                    disabled={deletingId === plan.id}
                    title="Delete plan"
                    className="px-3 rounded border border-[#F44336] text-[#F44336] hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              }
            />
          ))}

          {/* PROVIDE A CUSTOM PLAN: same form, name prefilled with "Custom" */}
          <div
            onClick={() => openNew(true)}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-[#2196F3] bg-white p-6 cursor-pointer text-center group transition-all min-h-[380px]"
          >
            <span className="text-[15px] font-bold tracking-wide text-[#2196F3] group-hover:underline">PROVIDE A CUSTOM PLAN</span>
          </div>
        </div>
      )}

      {/* ─── Add / edit subscription plan ─── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeForm}>
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-bold text-[#212121]">
              {editingId ? 'Edit' : 'Add'} {audience === 'FRANCHISE' && !isFranchise ? 'franchise' : 'business'} plan
            </h3>
            <p className="text-[12px] text-gray-500 mb-4">
              {audience === 'FRANCHISE' && !isFranchise ? 'Plan a franchise buys' : 'Plan for businesses'}
              {editingId ? ' · accounts already on this plan keep their current terms' : ''}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
                <input type="checkbox" checked={form.isFreeTrial} onChange={(e) => set('isFreeTrial', e.target.checked)} className={checkClass} />
                <span>Is this a free trial plan?</span>
              </label>

              {/* Plan name: main tiers, or Other for a custom name */}
              <div className="space-y-3">
                <div className="relative">
                  <select value={form.tier} onChange={(e) => set('tier', e.target.value)} className={fieldClass}>
                    {PLAN_TIERS.map((tier) => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                    <option value={OTHER_PLAN}>Other (custom name)</option>
                  </select>
                  <label className={labelClass}>Subscription plan *</label>
                </div>
                {form.tier === OTHER_PLAN && (
                  <input
                    type="text"
                    placeholder="Enter subscription plan name (Required) *"
                    value={form.customName}
                    onChange={(e) => set('customName', e.target.value)}
                    required
                    className="w-full rounded border border-gray-300 px-3.5 py-2.5 text-[14px] text-gray-800 placeholder:text-gray-400 focus:border-[#2196F3] focus:outline-none"
                  />
                )}
              </div>

              {/* Validity: unit + number → To date-time filled from From (same day, month and time) */}
              <ValidityDates
                unit={planDates.unit}
                count={planDates.count}
                from={planDates.from}
                to={planDates.to}
                onUnitChange={planDates.onUnitChange}
                onCountChange={planDates.onCountChange}
                onFromChange={planDates.onFromChange}
                onToChange={planDates.onToChange}
              />

              {!form.isFreeTrial && (
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    required
                    className={fieldClass}
                  />
                  <label className={labelClass}>Price (₹) *</label>
                </div>
              )}

              {/* What's included */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-[14px] font-bold text-[#212121]">What's included</h4>

                {/* Every plan has 1 digital card */}
                <label className="flex items-center gap-2 select-none text-[14px] text-gray-400">
                  <input type="checkbox" checked disabled className="h-4 w-4 rounded border-gray-300 text-gray-400" />
                  <span>1 Digital card</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
                  <input type="checkbox" checked={form.includeImages} onChange={(e) => set('includeImages', e.target.checked)} className={checkClass} />
                  <span>Unlimited greeting images</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
                  <input type="checkbox" checked={form.includeVideos} onChange={(e) => set('includeVideos', e.target.checked)} className={checkClass} />
                  <span>{form.videosPerDay} daily greeting videos</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
                  <input type="checkbox" checked={form.includeAi} onChange={(e) => set('includeAi', e.target.checked)} className={checkClass} />
                  <span>AI credits</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121] pt-1">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className={checkClass} />
                  <span>Active (can be selected for {audience === 'FRANCHISE' && !isFranchise ? 'franchises' : 'businesses'})</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-1.5 text-[13px] font-bold text-[#2196F3] hover:text-[#1976D2] uppercase tracking-wide transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded border border-[#2196F3] px-5 py-1.5 text-[13px] font-bold text-[#2196F3] hover:bg-blue-50 uppercase tracking-wide transition-colors disabled:opacity-60"
                >
                  {isSaving ? 'Saving…' : editingId ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPricingManagement;
