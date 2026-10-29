import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Crown,
  MoreVertical,
  Plus,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ValidityDates,
  useValidityDates,
  PlanCard,
  fromApiUnit,
  formatPlanValidity,
  formatDisplayDateTime,
  inputToIso,
} from '@/pages/superadmin/CustomerPricingManagement';
import { getPlans, isPlanLive, planErrorText, selectPlan, SelectedPlanTerms } from '@/lib/api/superadmin/plan';
import { SUPERADMIN_FRANCHISE_KEYS } from '@/lib/react-query/queryKeys';

const formatDisplayDate = formatDisplayDateTime;

interface ProjectsAndPaymentsProps {
  business: {
    id: string;
    fullname?: string;
    businessId?: string;
    phoneNumber?: string;
    email?: string;
    subscriptionStatus?: string;
    aiCredit?: number;
    madeBy?: string;
    creationDate?: string;
    categoryName?: string;
  };
  onBack: () => void;
  onEdit?: (business: any) => void;
  onDelete?: (business: any) => void;
  /** Franchise view: only the Payments tab (no digital card projects) */
  paymentsOnly?: boolean;
  /** Whose plan is set: a business (admin plans) or a franchise (franchise plans) */
  planTarget?: 'admin' | 'franchise';
  /** Franchise that owns this business; its own plans are the ones that can be selected */
  ownerFranchiseId?: string;
  /** Plan terms already saved on the record */
  currentPlan?: SelectedPlanTerms | null;
}

export const ProjectsAndPayments: React.FC<ProjectsAndPaymentsProps> = ({
  business,
  onBack,
  onEdit,
  onDelete,
  paymentsOnly = false,
  planTarget = 'admin',
  ownerFranchiseId,
  currentPlan: savedPlan = null,
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'payments'>(paymentsOnly ? 'payments' : 'projects');
  const queryClient = useQueryClient();

  // Plan on the record; replaced by the API response after a selection
  const [currentPlan, setCurrentPlan] = useState<SelectedPlanTerms | null>(savedPlan);

  // Upgrade popup: pick one of the active plans, then edit price and dates
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [upgradePrice, setUpgradePrice] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const upgradeDates = useValidityDates();

  const audience = planTarget === 'franchise' ? 'FRANCHISE' : 'ADMIN';
  const { data: plans = [], isLoading: plansLoading, isError: plansError, error: plansErr } = useQuery({
    queryKey: ['plans', 'select', audience, ownerFranchiseId || ''],
    queryFn: () => getPlans({ audience, franchiseId: ownerFranchiseId || undefined, isActive: true }),
    enabled: showUpgrade,
  });
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const choosePlan = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    setSelectedPlanId(planId);
    if (!plan) return;
    setUpgradePrice(String(plan.isFreeTrial ? 0 : plan.price));
    upgradeDates.applyLength(fromApiUnit(plan.validityUnit), plan.validityValue);
  };

  const closeUpgrade = () => {
    setShowUpgrade(false);
    setSelectedPlanId('');
    setUpgradePrice('');
    upgradeDates.reset();
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }
    if (upgradeDates.count < 1 || upgradeDates.to <= upgradeDates.from) {
      toast.error('Enter the number of years / months / days (1 or more)');
      return;
    }
    setIsUpgrading(true);
    try {
      const saved = await selectPlan(planTarget, business.id, {
        planId: selectedPlan.id,
        price: Number(upgradePrice) || 0,
        startDate: inputToIso(upgradeDates.from),
        expiryDate: inputToIso(upgradeDates.to),
      });
      setCurrentPlan({
        planId: saved?.planId || selectedPlan.id,
        planName: saved?.planName || selectedPlan.name,
        isFreeTrial: saved?.isFreeTrial ?? selectedPlan.isFreeTrial,
        amount: saved?.amount ?? (Number(upgradePrice) || 0),
        startDate: saved?.startDate || upgradeDates.from,
        expiryDate: saved?.expiryDate || upgradeDates.to,
        plan: saved?.plan || selectedPlan,
      });
      // Lists show the new status / plan
      queryClient.invalidateQueries({ queryKey: planTarget === 'franchise' ? [SUPERADMIN_FRANCHISE_KEYS.GET_ALL] : ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success(`${selectedPlan.name} active till ${formatDisplayDate(saved?.expiryDate || upgradeDates.to)}`);
      closeUpgrade();
    } catch (error) {
      toast.error(planErrorText(error, 'Failed to select plan'));
    } finally {
      setIsUpgrading(false);
    }
  };

  const businessSlug = (business.fullname || 'business')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const cardLink = `https://digiwebcard.in/${businessSlug}`;
  const cardNumber = business.businessId || '14687';
  const isSubscribed = currentPlan ? isPlanLive(currentPlan) : business.subscriptionStatus === 'Subscribed';
  const planLength = currentPlan?.plan?.validityValue
    ? formatPlanValidity(currentPlan.plan.validityValue, currentPlan.plan.validityUnit)
    : '-';

  return (
    <div className="w-full space-y-4 font-['Roboto',Helvetica,Arial,sans-serif]">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E0E0E0]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[18px] font-medium text-[#212121]">{paymentsOnly ? 'Subscription & Payments' : 'Projects & Payments'}</h1>
        </div>

       
      </div>

      {/* Business Title & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-[20px] font-bold text-[#212121]">
            {business.fullname || ''}
          </h2>

          {/* Status pill */}
          <span
            className={`whitespace-nowrap px-3 py-0.5 rounded-full text-[12px] font-medium text-white ${
              isSubscribed ? 'bg-[#4CAF50]' : 'bg-[#F44336]'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
          </span>

          {currentPlan?.planName && (
            <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-[12px] font-medium">
              {currentPlan.planName}
              {currentPlan.expiryDate ? ` · ${isSubscribed ? 'till' : 'expired'} ${formatDisplayDate(currentPlan.expiryDate)}` : ''}
            </span>
          )}
        </div>

        {/* Edit and Delete action boxes */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit?.(business)}
            title="Edit Business"
            className="p-2 rounded border border-[#2196F3] text-[#2196F3] hover:bg-blue-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(business)}
            title="Delete Business"
            className="p-2 rounded border border-[#F44336] text-[#F44336] hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upgrade: opens the subscription popup */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setShowUpgrade(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[13px] font-medium transition-colors"
        >
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          Upgrade
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E0E0E0] mt-3">
        <div className="flex gap-8">
          {!paymentsOnly && (
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`pb-2.5 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === 'projects'
                ? 'border-[#2196F3] text-[#2196F3]'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Projects
          </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`pb-2.5 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-[#2196F3] text-[#2196F3]'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Payments
          </button>
        </div>
      </div>

      {/* Tab 1: Projects Content */}
      {!paymentsOnly && activeTab === 'projects' && (
        <div className="space-y-6 pt-2">
          {/* Digital Card Section */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-[#212121]">Digital Card</h3>

            <div className="overflow-x-auto rounded border border-[#E0E0E0] bg-white">
              <table className="w-full text-left font-['Roboto',Helvetica,Arial,sans-serif]">
                <thead>
                  <tr className="bg-[#2196F3] text-white border-none select-none">
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white">Digital Card No</th>
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white">Card Link</th>
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white">Creation Date</th>
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white">Card Made By</th>
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white">Payment status</th>
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white">Digital card Status</th>
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr className="hover:bg-gray-50 border-b border-[#E0E0E0]">
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">{cardNumber}</td>
                    <td className="px-3 py-2.5 text-[14px]">
                      <a
                        href={cardLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[#2196F3] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[200px]">{cardLink}</span>
                      </a>
                    </td>
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">
                      {business.creationDate || '24 Oct, 2026 (2 days ago)'}
                    </td>
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">
                      {business.madeBy || 'Ratan Chavan (8482980338)'}
                    </td>
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">
                      {isSubscribed ? 'Done' : 'Not Done'}
                    </td>
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">Active</td>
                    <td className="px-3 py-2.5 text-[14px] text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit?.(business)}
                          className="p-1 text-gray-600 hover:text-[#2196F3]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toast.success('Card options')}
                          className="p-1 text-gray-600 hover:text-[#2196F3]"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payments Content */}
      {activeTab === 'payments' && (
        <div className="space-y-4 pt-2">
          <h3 className="text-[15px] font-bold text-[#212121]">Current Plan</h3>
          <div className="overflow-x-auto rounded border border-[#E0E0E0] bg-white">
            <table className="w-full text-left font-['Roboto',Helvetica,Arial,sans-serif]">
              <thead>
                <tr className="bg-[#2196F3] text-white">
                  <th className="px-3 py-2.5 text-[14px] font-medium">Plan</th>
                  <th className="px-3 py-2.5 text-[14px] font-medium">Validity</th>
                  <th className="px-3 py-2.5 text-[14px] font-medium">From</th>
                  <th className="px-3 py-2.5 text-[14px] font-medium">To</th>
                  <th className="px-3 py-2.5 text-[14px] font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {/* The backend keeps only the current plan (no history yet) */}
                {!currentPlan?.planId ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-[13px] text-gray-500">
                      No plan yet. Use Upgrade to select a subscription plan.
                    </td>
                  </tr>
                ) : (
                  <tr className="hover:bg-gray-50 border-b border-[#E0E0E0]">
                    <td className="px-3 py-2.5 text-[14px] font-medium text-[#212121]">
                      {currentPlan.planName}
                      {currentPlan.isFreeTrial && <span className="ml-2 text-[11px] font-medium text-emerald-700">Free trial</span>}
                    </td>
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">{planLength}</td>
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">{formatDisplayDate(currentPlan.startDate) || '-'}</td>
                    <td className={`px-3 py-2.5 text-[14px] ${isSubscribed ? 'text-[#212121]' : 'text-red-600 font-medium'}`}>
                      {formatDisplayDate(currentPlan.expiryDate) || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-[14px] font-bold text-[#212121]">₹{(currentPlan.amount ?? 0).toLocaleString('en-IN')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Upgrade subscription popup ─── */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeUpgrade}>
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-bold text-[#212121]">Select subscription plan</h3>
            <p className="text-[12px] text-gray-500 mb-4">{business.fullname}</p>

            <form onSubmit={handleUpgradeSubmit} className="space-y-4">
              {/* Active plans of the right list (business / franchise, owner franchise) */}
              {plansLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-[14px] text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading plans…
                </div>
              ) : plansError ? (
                <div className="py-10 text-center text-[14px] text-red-600">{planErrorText(plansErr, 'Failed to load plans')}</div>
              ) : plans.length === 0 ? (
                <div className="py-10 text-center text-[14px] text-gray-500">
                  No active {planTarget === 'franchise' ? 'franchise' : 'business'} plans. Add one in Customer plans & pricing.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      selected={plan.id === selectedPlanId}
                      onClick={() => choosePlan(plan.id)}
                      footer={
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            choosePlan(plan.id);
                          }}
                          className={`w-full rounded py-2 text-[13px] font-bold uppercase tracking-wider shadow-sm transition-all ${
                            plan.id === selectedPlanId
                              ? 'bg-[#2196F3] text-white'
                              : 'bg-gradient-to-r from-[#FF7043] to-[#FF5722] hover:opacity-95 text-white'
                          }`}
                        >
                          {plan.id === selectedPlanId ? 'Selected' : 'Select plan'}
                        </button>
                      }
                    />
                  ))}
                </div>
              )}

              {selectedPlan && (
              <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50/60 p-4">
              <p className="text-[13px] font-medium text-[#212121]">
                {selectedPlan.name}: change the price or dates for this {planTarget === 'franchise' ? 'franchise' : 'business'} if needed
              </p>
              {/* Unit + number → To date filled from From date (same day & month) */}
              <ValidityDates
                unit={upgradeDates.unit}
                count={upgradeDates.count}
                from={upgradeDates.from}
                to={upgradeDates.to}
                onUnitChange={upgradeDates.onUnitChange}
                onCountChange={upgradeDates.onCountChange}
                onFromChange={upgradeDates.onFromChange}
                onToChange={upgradeDates.onToChange}
              />

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={upgradePrice}
                  onChange={(e) => setUpgradePrice(e.target.value)}
                  required
                  className="w-full rounded border border-gray-300 px-3.5 pt-3 pb-2 text-[14px] text-gray-800 bg-white focus:border-[#2196F3] focus:outline-none"
                />
                <label className="absolute left-3 top-1 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500">
                  Price (₹) * · plan price ₹{selectedPlan.price.toLocaleString('en-IN')}
                </label>
              </div>
              </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeUpgrade}
                  className="px-4 py-1.5 text-[13px] font-bold text-[#2196F3] hover:text-[#1976D2] uppercase tracking-wide transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpgrading || !selectedPlan}
                  className="rounded border border-[#2196F3] px-5 py-1.5 text-[13px] font-bold text-[#2196F3] hover:bg-blue-50 uppercase tracking-wide transition-colors disabled:opacity-60"
                >
                  {isUpgrading ? 'Saving…' : 'Save plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) — projects only */}
      {!paymentsOnly && (
      <button
        type="button"
        onClick={() => toast.success('Create new project or card')}
        title="Add Project"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#2196F3] hover:bg-[#1E88E5] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>
      )}
    </div>
  );
};

export default ProjectsAndPayments;
