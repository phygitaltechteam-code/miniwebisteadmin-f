import { cardUrlFor, rebaseCardUrl } from '@/utils/cardUrl';
import React, { useState } from 'react';
import {
  ArrowLeft,
  Crown,
  Plus,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PlanCard,
  formatPlanValidity,
  formatDisplayDateTime,
} from '@/pages/superadmin/CustomerPricingManagement';
import { getPlans, isPlanLive, pickPlanTerms, planErrorText, selectPlan, SelectedPlanTerms } from '@/lib/api/superadmin/plan';
import { getAdminById, DigitalCardInfo } from '@/lib/api/superadmin/admin';
import { getTransactions } from '@/lib/api/superadmin/transaction';
import { SUPERADMIN_FRANCHISE_KEYS } from '@/lib/react-query/queryKeys';

const formatDisplayDate = formatDisplayDateTime;

const billDate = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

  // Business details by id: digital card table + latest plan terms
  const { data: adminDetail } = useQuery({
    queryKey: ['admin', 'detail', business.id],
    queryFn: () => getAdminById(business.id),
    enabled: planTarget === 'admin' && Boolean(business.id),
  });
  const card: DigitalCardInfo | undefined = adminDetail?.digitalCard;

  // Plan just selected here, else the one on the record
  const [selectedTerms, setCurrentPlan] = useState<SelectedPlanTerms | null>(null);
  const currentPlan = selectedTerms || (adminDetail ? pickPlanTerms(adminDetail) : null) || savedPlan;

  // Upgrade popup: pick one of the active plans, then a price popup (price editable; dates come from the plan)
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [showPrice, setShowPrice] = useState(false);
  const [price, setPrice] = useState('');
  // After Save plan: "Payment received?" → Yes sends DONE, No keeps it PENDING
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Payments tab: this business / franchise's bills, exactly as the transactions API returns them
  const {
    data: billsPage,
    isLoading: billsLoading,
    isError: billsError,
    error: billsErr,
  } = useQuery({
    queryKey: ['transactions-record', planTarget, business.id],
    queryFn: () =>
      getTransactions(planTarget === 'franchise' ? { franchiseId: business.id, type: 'FRANCHISE', limit: 100 } : { adminId: business.id, type: 'ADMIN', limit: 100 }),
    enabled: activeTab === 'payments' && Boolean(business.id),
  });
  const bills = billsPage?.rows || [];

  const audience = planTarget === 'franchise' ? 'FRANCHISE' : 'ADMIN';
  const { data: plans = [], isLoading: plansLoading, isError: plansError, error: plansErr } = useQuery({
    queryKey: ['plans', 'select', audience, ownerFranchiseId || ''],
    queryFn: () => getPlans({ audience, franchiseId: ownerFranchiseId || undefined, isActive: true }),
    enabled: showUpgrade,
  });
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  /** Select plan → price popup, prefilled with the plan price */
  const choosePlan = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    setSelectedPlanId(planId);
    setPrice(String(plan ? (plan.isFreeTrial ? 0 : plan.price) : ''));
    setConfirmPayment(false);
    setShowPrice(true);
  };

  const closePrice = () => {
    setShowPrice(false);
    setConfirmPayment(false);
    setSelectedPlanId('');
  };

  const closeUpgrade = () => {
    setShowUpgrade(false);
    closePrice();
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }
    if (price.trim() === '' || Number(price) < 0) {
      toast.error('Please enter the price');
      return;
    }
    setConfirmPayment(true);
  };

  const savePlan = async (paymentStatus: 'DONE' | 'PENDING') => {
    if (!selectedPlan) return;
    setIsUpgrading(true);
    try {
      // Plan + edited price; the backend starts it today and sets expiry from the plan's validity
      const saved = await selectPlan(planTarget, business.id, { planId: selectedPlan.id, price: Number(price), paymentStatus });
      setCurrentPlan({
        planId: saved?.planId || selectedPlan.id,
        planName: saved?.planName || selectedPlan.name,
        isFreeTrial: saved?.isFreeTrial ?? selectedPlan.isFreeTrial,
        amount: saved?.amount ?? Number(price),
        startDate: saved?.startDate,
        expiryDate: saved?.expiryDate,
        plan: saved?.plan || selectedPlan,
      });
      // Lists show the new status / plan
      queryClient.invalidateQueries({ queryKey: planTarget === 'franchise' ? [SUPERADMIN_FRANCHISE_KEYS.GET_ALL] : ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      // A new bill was added: refresh Billing and Report
      queryClient.invalidateQueries({ queryKey: ['transactions-recent'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-report'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-record'] });
      toast.success(saved?.expiryDate ? `${selectedPlan.name} active till ${formatDisplayDate(saved.expiryDate)}` : `${selectedPlan.name} selected`);
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

  // Digital card table: values from digitalCard, older fields until it loads
  // Backend link rebuilt on our card domain (VITE_CARD_BASE_URL)
  const cardLink = card?.cardLink ? rebaseCardUrl(card.cardLink) : cardUrlFor(businessSlug);
  const cardNumber = card?.cardNo || business.businessId || '-';
  const cardCreated = card?.createdAt ? formatDisplayDate(card.createdAt) : business.creationDate || '-';
  const cardMadeBy = card?.madeBy?.label || business.madeBy || '-';
  const paymentLabel = card?.paymentStatus
    ? { DONE: 'Done', PENDING: 'Pending', FREE_TRIAL: 'Free trial' }[card.paymentStatus] || card.paymentStatus
    : null;
  const cardStatus = card?.status
    ? { ACTIVE: 'Active', EXPIRED: 'Expired', INACTIVE: 'Inactive', DELETED: 'Deleted' }[card.status] || card.status
    : null;
  const statusTone = (value?: string) =>
    value === 'DONE' || value === 'ACTIVE'
      ? 'text-[#2E7D32]'
      : value === 'FREE_TRIAL'
        ? 'text-[#1976D2]'
        : value
          ? 'text-[#D32F2F]'
          : 'text-[#212121]';
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

        {/* Upgrade: opens the subscription popup (same line as the name) */}
        <button
          type="button"
          onClick={() => setShowUpgrade(true)}
          className="shrink-0 self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[13px] font-medium whitespace-nowrap transition-colors"
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
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">{cardCreated}</td>
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">{cardMadeBy}</td>
                    <td className={`px-3 py-2.5 text-[14px] font-medium ${statusTone(card?.paymentStatus)}`}>
                      {paymentLabel || (isSubscribed ? 'Done' : 'Not Done')}
                    </td>
                    <td className={`px-3 py-2.5 text-[14px] font-medium ${statusTone(card?.status)}`}>{cardStatus || 'Active'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payments: this record's bills from the transactions API */}
      {activeTab === 'payments' && (
        <div className="space-y-4 pt-2">
          <div className="overflow-x-auto rounded border border-[#E0E0E0] bg-white">
            <table className="w-full text-left font-['Roboto',Helvetica,Arial,sans-serif]">
              <thead>
                <tr className="bg-[#2196F3] text-white">
                  {['Bill no', 'Added By (Role)', 'Payment Status', 'Payment date', 'Valid from - Valid to', 'Plan', 'Payment Through', 'Amount'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-[14px] font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {billsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-[13px] text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading payments…
                    </td>
                  </tr>
                ) : billsError ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-[13px] text-red-600">
                      {(billsErr as any)?.response?.data?.message || (billsErr as any)?.message || 'Failed to load payments'}
                    </td>
                  </tr>
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-[13px] text-gray-500">No payments yet.</td>
                  </tr>
                ) : (
                  bills.map((row) => {
                    const paid = String(row.paymentStatus).toUpperCase() === 'DONE';
                    return (
                      <tr key={row.id || row.billNo} className="hover:bg-gray-50 border-b border-[#E0E0E0] text-[14px] text-[#212121]">
                        <td className="px-3 py-2.5 font-medium text-[#2196F3] whitespace-nowrap">{row.billNo}</td>
                        <td className="px-3 py-2.5">{row.addedBy?.label || row.addedBy?.fullname || '-'}</td>
                        <td className={`px-3 py-2.5 font-medium ${paid ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>{paid ? 'PAID' : 'PENDING'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{billDate(row.paymentDate)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{billDate(row.validFrom)} - {billDate(row.validTo)}</td>
                        <td className="px-3 py-2.5">{row.planLabel || '-'}</td>
                        <td className="px-3 py-2.5">{row.paymentMethod || '-'}</td>
                        <td className="px-3 py-2.5 font-bold whitespace-nowrap">₹{(Number(row.amount) || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })
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

            <div className="space-y-4">
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


              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeUpgrade}
                  className="px-4 py-1.5 text-[13px] font-bold text-[#2196F3] hover:text-[#1976D2] uppercase tracking-wide transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* ─── Price popup (after Select plan) ─── */}
          {showPrice && selectedPlan && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={(e) => { e.stopPropagation(); closePrice(); }}>
              <form
                onSubmit={handleUpgradeSubmit}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl space-y-4"
              >
                <div>
                  <h3 className="text-[17px] font-bold text-[#212121]">{selectedPlan.name}</h3>
                  <p className="text-[12px] text-gray-500">
                    {business.fullname} · {formatPlanValidity(selectedPlan.validityValue, selectedPlan.validityUnit)}
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    autoFocus
                    className="w-full rounded border border-gray-300 px-3.5 pt-3 pb-2 text-[14px] text-gray-800 bg-white focus:border-[#2196F3] focus:outline-none"
                  />
                  <label className="absolute left-3 top-1 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500">
                    Price (₹) * · plan price ₹{selectedPlan.price.toLocaleString('en-IN')}
                  </label>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closePrice}
                    className="px-4 py-1.5 text-[13px] font-bold text-[#2196F3] hover:text-[#1976D2] uppercase tracking-wide transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpgrading}
                    className="rounded border border-[#2196F3] px-5 py-1.5 text-[13px] font-bold text-[#2196F3] hover:bg-blue-50 uppercase tracking-wide transition-colors disabled:opacity-60"
                  >
                    {isUpgrading ? 'Saving…' : 'Save plan'}
                  </button>
                </div>
              </form>

              {/* ─── Payment confirmation ─── */}
              {confirmPayment && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={(e) => { e.stopPropagation(); if (!isUpgrading) setConfirmPayment(false); }}>
                  <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl space-y-4 text-center">
                    <div>
                      <h3 className="text-[17px] font-bold text-[#212121]">Payment received?</h3>
                      <p className="mt-1 text-[13px] text-gray-500">
                        {selectedPlan.name} · ₹{(Number(price) || 0).toLocaleString('en-IN')} for {business.fullname}.
                        <br />Has this payment been done?
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={isUpgrading}
                        onClick={() => savePlan('PENDING')}
                        className="flex-1 rounded border border-gray-300 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-50 uppercase tracking-wide disabled:opacity-60"
                      >
                        No, pending
                      </button>
                      <button
                        type="button"
                        disabled={isUpgrading}
                        onClick={() => savePlan('DONE')}
                        className="flex-1 rounded bg-[#2196F3] hover:bg-[#1E88E5] py-2 text-[13px] font-bold text-white uppercase tracking-wide disabled:opacity-60"
                      >
                        {isUpgrading ? 'Saving…' : 'Yes, done'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
