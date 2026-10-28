import React, { useState } from 'react';
import {
  Check,
  X,
  Sparkles,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PlanItem {
  id: string;
  name: string;
  price: number | string;
  validity: number | string;
  validityUnit: string;
  aiCredits: number;
  digitalCards: string;
  changeTheme: boolean;
  editDetails: boolean;
  unlimitedImages: boolean;
  dailyVideos: number | string;
  unlimitedAds: boolean;
  allGeneralFrames: boolean;
  allProductFrames: boolean;
  allPoliticalFrames: boolean;
  validFrom?: string;
  validTo?: string;
}

type ValidityUnit = 'Year' | 'Month' | 'Day';

// Main plan tiers offered in the plan name dropdown; 'Other' lets the user type a custom name
const PLAN_TIERS = ['Silver', 'Gold', 'Platinum'];
const OTHER_PLAN = 'Other';

/** yyyy-mm-dd in local time (what <input type="date"> uses) */
const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const todayInput = () => toDateInput(new Date());

/** `from` plus `count` units, as yyyy-mm-dd */
const addValidity = (from: string, unit: ValidityUnit, count = 1): string => {
  const d = new Date(`${from}T00:00:00`);
  if (unit === 'Year') d.setFullYear(d.getFullYear() + count);
  else if (unit === 'Month') d.setMonth(d.getMonth() + count);
  else d.setDate(d.getDate() + count);
  return toDateInput(d);
};

/** Whole units between two dates (at least 1) — e.g. 2026-01-01 → 2029-01-01 in Year = 3 */
const validityCount = (from: string, to: string, unit: ValidityUnit): number => {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  if (isNaN(a.getTime()) || isNaN(b.getTime()) || b <= a) return 1;
  if (unit === 'Day') return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
  const months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  return Math.max(1, unit === 'Year' ? Math.round(months / 12) : months);
};

const formatDisplayDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface ValidityDatesProps {
  unit: ValidityUnit;
  from: string;
  to: string;
  onUnitChange: (unit: ValidityUnit) => void;
  onFromChange: (from: string) => void;
  onToChange: (to: string) => void;
}

/** Validity unit + From / To dates. Picking a unit fills To = From + 1 unit; dates can still be edited. */
const ValidityDates: React.FC<ValidityDatesProps> = ({ unit, from, to, onUnitChange, onFromChange, onToChange }) => {
  const fieldClass =
    'w-full rounded border border-gray-300 px-3.5 pt-3 pb-2 text-[14px] text-gray-800 bg-white focus:border-[#2196F3] focus:outline-none';
  const labelClass = 'absolute left-3 top-1 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500';
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <select value={unit} onChange={(e) => onUnitChange(e.target.value as ValidityUnit)} className={fieldClass}>
            <option value="Year">Year</option>
            <option value="Month">Month</option>
            <option value="Day">Day</option>
          </select>
          <label className={labelClass}>Validity unit</label>
        </div>
        <div className="relative">
          <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} required className={fieldClass} />
          <label className={labelClass}>From date *</label>
        </div>
        <div className="relative">
          <input type="date" value={to} min={from} onChange={(e) => onToChange(e.target.value)} required className={fieldClass} />
          <label className={labelClass}>To date *</label>
        </div>
      </div>
      <p className="text-[12px] text-gray-500">
        Validity: {validityCount(from, to, unit)} {unit}
        {validityCount(from, to, unit) > 1 ? 's' : ''} ({formatDisplayDate(from)} – {formatDisplayDate(to)})
      </p>
    </div>
  );
};

/** State + handlers for one ValidityDates field group */
const useValidityDates = () => {
  const [unit, setUnit] = useState<ValidityUnit>('Year');
  const [from, setFrom] = useState(todayInput);
  const [to, setTo] = useState(() => addValidity(todayInput(), 'Year'));

  return {
    unit,
    from,
    to,
    count: validityCount(from, to, unit),
    onUnitChange: (u: ValidityUnit) => {
      setUnit(u);
      setTo(addValidity(from, u, 1));
    },
    onFromChange: (f: string) => {
      if (!f) return;
      // Keep the same length of validity when the start date moves
      const count = validityCount(from, to, unit);
      setFrom(f);
      setTo(addValidity(f, unit, count));
    },
    onToChange: (t: string) => {
      if (t) setTo(t);
    },
    reset: () => {
      setUnit('Year');
      setFrom(todayInput());
      setTo(addValidity(todayInput(), 'Year'));
    },
  };
};

export const CustomerPricingManagement: React.FC = () => {
  const [plans, setPlans] = useState<PlanItem[]>([
    {
      id: 'plan_1',
      name: 'Digital Business Card',
      price: '2999',
      validity: '1',
      validityUnit: 'Year',
      aiCredits: 0,
      digitalCards: '1 digital card',
      changeTheme: true,
      editDetails: true,
      unlimitedImages: true,
      dailyVideos: 3,
      unlimitedAds: true,
      allGeneralFrames: true,
      allProductFrames: true,
      allPoliticalFrames: true,
    },
    {
      id: 'plan_2',
      name: 'Digital Business card + Branding',
      price: '6000',
      validity: '3',
      validityUnit: 'Year',
      aiCredits: 0,
      digitalCards: '1 digital card',
      changeTheme: true,
      editDetails: true,
      unlimitedImages: true,
      dailyVideos: 3,
      unlimitedAds: true,
      allGeneralFrames: true,
      allProductFrames: true,
      allPoliticalFrames: true,
    },
    {
      id: 'plan_3',
      name: 'Digital business card + Branding posts',
      price: '8999',
      validity: '5',
      validityUnit: 'Year',
      aiCredits: 0,
      digitalCards: '1 digital card',
      changeTheme: true,
      editDetails: true,
      unlimitedImages: true,
      dailyVideos: 3,
      unlimitedAds: true,
      allGeneralFrames: true,
      allProductFrames: true,
      allPoliticalFrames: true,
    },
  ]);

  // Modals state
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showCustomPlanModal, setShowCustomPlanModal] = useState(false);

  // Add Plan form state (Image 1)
  const [isFreeTrial, setIsFreeTrial] = useState(false);
  const [addPlanTier, setAddPlanTier] = useState(PLAN_TIERS[0]);
  const [addPlanName, setAddPlanName] = useState('');
  const addValidityDates = useValidityDates();
  const [addPrice, setAddPrice] = useState('');
  const [addIncludeImages, setAddIncludeImages] = useState(false);
  const [addIncludeVideos, setAddIncludeVideos] = useState(false);
  const [addIncludeAi, setAddIncludeAi] = useState(false);

  // Custom Plan form state (Image 2)
  const [customPlanName, setCustomPlanName] = useState('Custom');
  const customValidityDates = useValidityDates();
  const [customPrice, setCustomPrice] = useState('');
  const [customIncludeImages, setCustomIncludeImages] = useState(false);
  const [customIncludeVideos, setCustomIncludeVideos] = useState(false);
  const [customIncludeAi, setCustomIncludeAi] = useState(false);

  const handleAddPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const planName = addPlanTier === OTHER_PLAN ? addPlanName.trim() : addPlanTier;
    if (!planName) {
      toast.error('Please enter plan name');
      return;
    }
    if (addValidityDates.to <= addValidityDates.from) {
      toast.error('To date must be after From date');
      return;
    }
    const newPlan: PlanItem = {
      id: `plan_${Date.now()}`,
      name: planName,
      price: isFreeTrial ? '0' : addPrice || '0',
      validity: addValidityDates.count,
      validityUnit: addValidityDates.unit,
      validFrom: addValidityDates.from,
      validTo: addValidityDates.to,
      aiCredits: addIncludeAi ? 50 : 0,
      digitalCards: '1 digital card',
      changeTheme: true,
      editDetails: true,
      unlimitedImages: addIncludeImages,
      dailyVideos: addIncludeVideos ? 3 : 0,
      unlimitedAds: true,
      allGeneralFrames: true,
      allProductFrames: true,
      allPoliticalFrames: true,
    };
    setPlans((prev) => [...prev, newPlan]);
    toast.success('Subscription plan added successfully!');
    setShowAddPlanModal(false);
    // Reset form
    setAddPlanTier(PLAN_TIERS[0]);
    setAddPlanName('');
    addValidityDates.reset();
    setAddPrice('');
    setIsFreeTrial(false);
  };

  const handleCustomPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPlanName.trim()) {
      toast.error('Please enter custom plan name');
      return;
    }
    const newCustom: PlanItem = {
      id: `custom_${Date.now()}`,
      name: customPlanName,
      price: customPrice || '1999',
      validity: customValidityDates.count,
      validityUnit: customValidityDates.unit,
      validFrom: customValidityDates.from,
      validTo: customValidityDates.to,
      aiCredits: customIncludeAi ? 50 : 0,
      digitalCards: '1 digital card',
      changeTheme: true,
      editDetails: true,
      unlimitedImages: customIncludeImages,
      dailyVideos: customIncludeVideos ? 3 : 0,
      unlimitedAds: true,
      allGeneralFrames: true,
      allProductFrames: true,
      allPoliticalFrames: true,
    };
    setPlans((prev) => [...prev, newCustom]);
    toast.success('Custom plan created and applied!');
    setShowCustomPlanModal(false);
  };

  return (
    <div className="w-full space-y-6 font-['Roboto',Helvetica,Arial,sans-serif]">
      {/* Top Bar with Add Subscription Plan button */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E0E0E0]">
        <div>
          <h2 className="text-[18px] font-medium text-[#212121]">
            Customer Plans & Pricing
          </h2>
          <p className="text-[12px] text-gray-500">
            Manage public pricing tier cards and custom plans
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddPlanModal(true)}
          className="flex items-center gap-1.5 rounded bg-[#2196F3] hover:bg-[#1E88E5] px-4 py-1.5 text-[13px] font-medium text-white shadow-none transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Subscription Plan
        </button>
      </div>

      {/* Screen Title matching Image 3 */}
      <div className="text-center pt-2">
        <h1 className="text-[22px] font-bold text-[#212121]">Choose your plan</h1>
      </div>

      {/* Plan Cards Grid matching Image 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch pt-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow relative"
          >
            {/* Blue Header Tag */}
            <div className="rounded-md bg-[#2196F3] px-3 py-2 text-center text-white font-medium text-[14px] leading-tight min-h-[44px] flex items-center justify-center">
              {plan.name}
            </div>

            {/* Price & Validity Gray Box */}
            <div className="my-3 rounded border border-gray-200 bg-gray-50/80 p-2.5 text-center">
              <div className="text-[20px] font-bold text-[#212121]">
                ₹{plan.price}/-
              </div>
              <div className="text-[12px] text-gray-600 font-medium">
                Validity: {plan.validity} {plan.validityUnit}
              </div>
              {plan.validFrom && plan.validTo && (
                <div className="text-[11px] text-gray-500">
                  {formatDisplayDate(plan.validFrom)} – {formatDisplayDate(plan.validTo)}
                </div>
              )}
            </div>

            {/* AI Credits Pill */}
            <div className="flex items-center justify-center gap-1.5 pb-3 text-[13px] font-semibold text-purple-700">
              <X className="w-3.5 h-3.5 text-red-500 stroke-[3]" />
              <span>{plan.aiCredits} AI Credits</span>
            </div>

            {/* Digital Card Section */}
            <div className="space-y-1.5 text-[13px] pb-3 border-b border-gray-100">
              <div className="font-bold text-[#212121]">Digital Card</div>
              <div className="flex items-start gap-1.5 text-gray-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>{plan.digitalCards}</span>
              </div>
              <div className="flex items-start gap-1.5 text-gray-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Change theme anytime</span>
              </div>
              <div className="flex items-start gap-1.5 text-gray-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Edit details anytime</span>
              </div>
            </div>

            {/* Greetings Section */}
            <div className="space-y-1.5 text-[13px] pt-3 flex-1 pb-4">
              <div className="font-bold text-[#212121]">Greetings</div>
              <div className="flex items-start gap-1.5 text-gray-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Download unlimited images</span>
              </div>
              <div className="flex items-start gap-1.5 text-gray-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Download {plan.dailyVideos} videos per day</span>
              </div>
              <div className="flex items-start gap-1.5 text-gray-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Download unlimited business ads images</span>
              </div>
              <div className="flex items-start gap-1.5 text-gray-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>All general frames access</span>
              </div>
              <div className="flex items-start gap-1.5 text-gray-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>All product frames access</span>
              </div>
              <div className="flex items-start gap-1.5 text-gray-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>All political frames access</span>
              </div>
            </div>

            {/* Coral/Orange Gradient SELECT PLAN Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => toast.success(`Selected plan: ${plan.name}`)}
                className="w-full rounded bg-gradient-to-r from-[#FF7043] to-[#FF5722] hover:opacity-95 text-white py-2 text-[13px] font-bold uppercase tracking-wider shadow-sm transition-all text-center"
              >
                SELECT PLAN
              </button>
            </div>
          </div>
        ))}

        {/* 4th Card: PROVIDE A CUSTOM PLAN (Image 3) */}
        <div
          onClick={() => setShowCustomPlanModal(true)}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-[#2196F3] bg-white p-6 cursor-pointer text-center group transition-all min-h-[380px]"
        >
          <span className="text-[15px] font-bold tracking-wide text-[#2196F3] group-hover:underline">
            PROVIDE A CUSTOM PLAN
          </span>
        </div>
      </div>

      {/* ─── Modal 1: Add Subscription Plan (Image 1) ─────────────────────── */}
      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[18px] font-bold text-[#212121] mb-4">
              Add subscription plan
            </h3>

            <form onSubmit={handleAddPlanSubmit} className="space-y-4">
              {/* Is free trial checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
                <input
                  type="checkbox"
                  checked={isFreeTrial}
                  onChange={(e) => setIsFreeTrial(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#2196F3] focus:ring-[#2196F3]"
                />
                <span>Is this a free trial plan?</span>
              </label>

              {/* Plan name: main tiers, or Other for a custom name */}
              <div className="space-y-3">
                <div className="relative">
                  <select
                    value={addPlanTier}
                    onChange={(e) => setAddPlanTier(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3.5 pt-3 pb-2 text-[14px] text-gray-800 bg-white focus:border-[#2196F3] focus:outline-none"
                  >
                    {PLAN_TIERS.map((tier) => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                    <option value={OTHER_PLAN}>Other (custom name)</option>
                  </select>
                  <label className="absolute left-3 top-1 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500">
                    Subscription plan *
                  </label>
                </div>
                {addPlanTier === OTHER_PLAN && (
                  <input
                    type="text"
                    placeholder="Enter subscription plan name (Required) *"
                    value={addPlanName}
                    onChange={(e) => setAddPlanName(e.target.value)}
                    required
                    className="w-full rounded border border-gray-300 px-3.5 py-2.5 text-[14px] text-gray-800 placeholder:text-gray-400 focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
                  />
                )}
              </div>

              {/* Validity: unit + From / To dates (filled automatically from the unit) */}
              <ValidityDates
                unit={addValidityDates.unit}
                from={addValidityDates.from}
                to={addValidityDates.to}
                onUnitChange={addValidityDates.onUnitChange}
                onFromChange={addValidityDates.onFromChange}
                onToChange={addValidityDates.onToChange}
              />

              {/* Price input */}
              {!isFreeTrial && (
                <div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter price (Required) *"
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                    required
                    className="w-full rounded border border-gray-300 px-3.5 py-2.5 text-[14px] text-gray-800 placeholder:text-gray-400 focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
                  />
                </div>
              )}

              {/* What's included checklist */}
              <div className="space-y-2 pt-2">
                <h4 className="text-[14px] font-bold text-[#212121]">
                  What's included
                </h4>

                <label className="flex items-center gap-2 select-none text-[14px] text-gray-400">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="h-4 w-4 rounded border-gray-300 text-gray-400"
                  />
                  <span>1 Digital card</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
                  <input
                    type="checkbox"
                    checked={addIncludeImages}
                    onChange={(e) => setAddIncludeImages(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#2196F3] focus:ring-[#2196F3]"
                  />
                  <span>Unlimited greeting images</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
                  <input
                    type="checkbox"
                    checked={addIncludeVideos}
                    onChange={(e) => setAddIncludeVideos(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#2196F3] focus:ring-[#2196F3]"
                  />
                  <span>3 daily greeting videos</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
                  <input
                    type="checkbox"
                    checked={addIncludeAi}
                    onChange={(e) => setAddIncludeAi(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#2196F3] focus:ring-[#2196F3]"
                  />
                  <span>AI credits</span>
                </label>
              </div>

              {/* Bottom buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddPlanModal(false)}
                  className="px-4 py-1.5 text-[13px] font-bold text-[#2196F3] hover:text-[#1976D2] uppercase tracking-wide transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="rounded border border-[#2196F3] px-5 py-1.5 text-[13px] font-bold text-[#2196F3] hover:bg-blue-50 uppercase tracking-wide transition-colors"
                >
                  SUBMIT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Provide Custom Plan (Image 2) ────────────────────────── */}
      {showCustomPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[18px] font-bold text-[#212121] mb-4">
              Provide custom plan
            </h3>

            <form onSubmit={handleCustomPlanSubmit} className="space-y-4">
              {/* Plan name input with floating label */}
              <div className="relative">
                <input
                  type="text"
                  value={customPlanName}
                  onChange={(e) => setCustomPlanName(e.target.value)}
                  placeholder=" "
                  required
                  className="peer w-full rounded border border-gray-300 px-3.5 pt-3.5 pb-2 text-[14px] text-gray-800 focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
                />
                <label className="absolute left-3 top-1 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500 peer-focus:text-[#2196F3]">
                  Enter subscription plan name (Required) *
                </label>
              </div>

              {/* Validity: unit + From / To dates (filled automatically from the unit) */}
              <ValidityDates
                unit={customValidityDates.unit}
                from={customValidityDates.from}
                to={customValidityDates.to}
                onUnitChange={customValidityDates.onUnitChange}
                onFromChange={customValidityDates.onFromChange}
                onToChange={customValidityDates.onToChange}
              />

              {/* Price input */}
              <div>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter price (Required) *"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  required
                  className="w-full rounded border border-gray-300 px-3.5 py-2.5 text-[14px] text-gray-800 placeholder:text-gray-400 focus:border-[#2196F3] focus:outline-none"
                />
              </div>

              {/* What's included checklist */}
              <div className="space-y-2 pt-2">
                <h4 className="text-[14px] font-bold text-[#212121]">
                  What's included
                </h4>

                <label className="flex items-center gap-2 select-none text-[14px] text-gray-400">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="h-4 w-4 rounded border-gray-300 text-gray-400"
                  />
                  <span>1 Digital card</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
                  <input
                    type="checkbox"
                    checked={customIncludeImages}
                    onChange={(e) => setCustomIncludeImages(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#2196F3] focus:ring-[#2196F3]"
                  />
                  <span>Unlimited greeting images</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
                  <input
                    type="checkbox"
                    checked={customIncludeVideos}
                    onChange={(e) => setCustomIncludeVideos(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#2196F3] focus:ring-[#2196F3]"
                  />
                  <span>3 daily greeting videos</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-[14px] text-[#212121]">
                  <input
                    type="checkbox"
                    checked={customIncludeAi}
                    onChange={(e) => setCustomIncludeAi(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#2196F3] focus:ring-[#2196F3]"
                  />
                  <span>AI credits</span>
                </label>
              </div>

              {/* Bottom buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCustomPlanModal(false)}
                  className="px-4 py-1.5 text-[13px] font-bold text-[#2196F3] hover:text-[#1976D2] uppercase tracking-wide transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="rounded border border-[#2196F3] px-5 py-1.5 text-[13px] font-bold text-[#2196F3] hover:bg-blue-50 uppercase tracking-wide transition-colors"
                >
                  PROCEED
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
