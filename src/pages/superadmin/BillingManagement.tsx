import React, { useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, ExternalLink, Loader2, Printer, Receipt } from 'lucide-react';
import { printElement } from '@/utils/printElement';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isFranchiseUser } from '@/utils/axios';
import { getTransactions } from '@/lib/api/superadmin/transaction';
import {
  getFranchiseMonthlyBill,
  getMonthlyBillsOverview,
  getDirectMonthlyReport,
  isPartPaid,
  markMonthlyBill,
  BillPartStatus,
  MonthlyBill,
  MonthlyBillPart,
} from '@/lib/api/superadmin/monthlyBill';
import { rebaseCardUrl } from '@/utils/cardUrl';
import { useGetFranchises } from '@/lib/react-query/superadmin/franchise';
import { FranchiseItem } from '@/lib/api/superadmin/franchise';

/** Franchise name: the bill's own, else the franchise list (the bills API returns businessName null) */
const franchiseLabel = (bill: MonthlyBill | null | undefined, franchises: FranchiseItem[] = []) => {
  const own = bill?.franchise?.businessName || bill?.franchise?.fullname;
  if (own) return own;
  const f = franchises.find((x) => x.id === bill?.franchise?.id || x._id === bill?.franchise?.id);
  return f?.user?.fullname || f?.fullname || f?.name || '-';
};

/** Bills shown in Plan Transactions */
const RECENT_BILLS = 20;

const billDate = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const rupees = (n?: number) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

/** yyyy-mm of the current month (the month picker's value and max) */
const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const toQuery = (ym: string) => {
  const [year, month] = ym.split('-').map(Number);
  return { year, month };
};
const apiError = (error: unknown, fallback: string) =>
  (error as any)?.response?.data?.message || (error as any)?.message || fallback;

const StatusPill: React.FC<{ part?: MonthlyBillPart }> = ({ part }) => (
  <span
    className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white ${
      isPartPaid(part) ? 'bg-[#4CAF50]' : 'bg-[#F44336]'
    }`}
  >
    {isPartPaid(part) ? 'PAID' : 'PENDING'}
  </span>
);

const thClass = 'px-3 py-2.5 text-[13px] font-medium whitespace-nowrap';
const tdClass = 'px-3 py-2.5 text-[13px] text-[#212121]';

/** One part of the bill (new cards / renewals): totals, mark paid, and its card list */
const BillPartSection: React.FC<{
  title: string;
  part: MonthlyBillPart;
  rate?: number;
  kind: 'new' | 'renewal';
  canMark: boolean;
  busy: boolean;
  onMark: (status: BillPartStatus) => void;
}> = ({ title, part, rate, kind, canMark, busy, onMark }) => {
  const paid = isPartPaid(part);
  const cards = part.cards || [];
  return (
    <div className="rounded border border-[#E0E0E0] bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#E0E0E0]">
        <h3 className="text-[15px] font-bold text-[#212121]">{title}</h3>
        {part.paymentStatus && <StatusPill part={part} />}
        <span className="text-[13px] text-gray-600">
          {part.count} card{part.count === 1 ? '' : 's'}
          {rate ? ` × ${rupees(rate)}` : ''} = <b className="text-[#212121]">{rupees(part.amount)}</b>
        </span>
        {paid && part.paymentReceivedDate && (
          <span className="text-[12px] text-gray-500">Received {billDate(part.paymentReceivedDate)}</span>
        )}
        {canMark && (
          <button
            type="button"
            disabled={busy || (!paid && part.count === 0)}
            onClick={() => onMark(paid ? 'PENDING' : 'DONE')}
            className={`print:hidden ml-auto rounded px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide disabled:opacity-50 ${
              paid ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-[#4CAF50] hover:bg-[#43A047] text-white'
            }`}
          >
            {paid ? 'Mark pending' : 'Mark paid'}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#2196F3] text-white">
              <th className={thClass}>#</th>
              <th className={thClass}>Business</th>
              <th className={thClass}>Card Link</th>
              <th className={thClass}>{kind === 'new' ? 'Created' : 'Renewed'}</th>
              {kind === 'renewal' && <th className={thClass}>Plan</th>}
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={kind === 'renewal' ? 5 : 4} className="px-3 py-5 text-center text-[13px] text-gray-500">
                  {kind === 'new' ? 'No new cards this month.' : 'No renewals this month.'}
                </td>
              </tr>
            ) : (
              cards.map((c, i) => {
                const link = c.cardLink ? rebaseCardUrl(c.cardLink) : '';
                return (
                  <tr key={`${c.adminId || c.cardLink}-${i}`} className="border-b border-[#E0E0E0] hover:bg-gray-50">
                    <td className={`${tdClass} text-gray-500`}>{i + 1}</td>
                    <td className={tdClass}>
                      {c.businessName || '-'}
                      {c.isDeleted && <span className="ml-2 text-[11px] font-medium text-red-600">Deleted</span>}
                    </td>
                    <td className={tdClass}>
                      {link ? (
                        <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2196F3] hover:underline">
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[260px]">{link}</span>
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>{billDate(kind === 'new' ? c.createdAt : c.renewedAt)}</td>
                    {kind === 'renewal' && <td className={tdClass}>{c.planName || '-'}</td>}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/** One franchise's bill for the month (SuperAdmin can mark each part paid; franchise only views) */
const FranchiseBillDetail: React.FC<{ franchiseId?: string; franchiseName?: string; month: string; onBack?: () => void }> = ({ franchiseId, franchiseName, month, onBack }) => {
  const queryClient = useQueryClient();
  const canMark = !isFranchiseUser() && Boolean(franchiseId);
  const { data: bill, isLoading, isError, error } = useQuery({
    queryKey: ['monthly-bill', franchiseId || 'own', month],
    queryFn: () => getFranchiseMonthlyBill(franchiseId, toQuery(month)),
  });

  // Mark paid / pending asks first
  const [pending, setPending] = useState<{ kind: 'new' | 'renewal'; status: BillPartStatus } | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmMark = async () => {
    if (!pending || !franchiseId) return;
    setBusy(true);
    try {
      await markMonthlyBill(franchiseId, {
        ...toQuery(month),
        ...(pending.kind === 'new' ? { newCardsStatus: pending.status } : { renewalStatus: pending.status }),
      });
      queryClient.invalidateQueries({ queryKey: ['monthly-bill'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-bills-overview'] });
      toast.success(pending.status === 'DONE' ? 'Marked as paid' : 'Marked as pending');
      setPending(null);
    } catch (err) {
      toast.error(apiError(err, 'Failed to update the bill'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {onBack && (
        <button type="button" onClick={onBack} className="print:hidden flex items-center gap-1.5 text-[13px] font-medium text-[#2196F3] hover:underline">
          <ArrowLeft className="w-4 h-4" /> All franchises
        </button>
      )}

      {isLoading ? (
        <div className="py-10 text-center text-[13px] text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading bill…
        </div>
      ) : isError || !bill ? (
        <div className="py-10 text-center text-[13px] text-red-600">{apiError(error, 'Failed to load the bill')}</div>
      ) : (
        <>
          {/* Bill summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['Bill No', bill.billNo || '-'],
              ['Franchise', bill.franchise?.businessName || bill.franchise?.fullname || franchiseName || '-'],
              ['Month · Rate', `${bill.monthLabel || month} · ${rupees(bill.rate)}/card`],
              ['Total amount', rupees(bill.totalAmount)],
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-[#E0E0E0] bg-white px-4 py-3 min-w-0">
                <div className="text-[12px] text-gray-500">{label}</div>
                <div className="text-[16px] font-bold text-[#212121] truncate">{value}</div>
              </div>
            ))}
          </div>
          {bill.note && <p className="text-[13px] text-gray-600">Note: {bill.note}</p>}

          <BillPartSection
            title="Card Details"
            part={bill.newCards}
            rate={bill.rate}
            kind="new"
            canMark={canMark}
            busy={busy}
            onMark={(status) => setPending({ kind: 'new', status })}
          />
          <BillPartSection
            title="Renewal Cards Details"
            part={bill.renewals}
            rate={bill.rate}
            kind="renewal"
            canMark={canMark}
            busy={busy}
            onMark={(status) => setPending({ kind: 'renewal', status })}
          />
        </>
      )}

      {/* Mark paid / pending confirmation */}
      {pending && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setPending(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl space-y-4 text-center">
            <div>
              <h3 className="text-[17px] font-bold text-[#212121]">{pending.status === 'DONE' ? 'Payment received?' : 'Mark as pending?'}</h3>
              <p className="mt-1 text-[13px] text-gray-500">
                {pending.kind === 'new' ? 'Card Details' : 'Renewal Cards Details'} ·{' '}
                {rupees(pending.kind === 'new' ? bill?.newCards.amount : bill?.renewals.amount)}
                <br />
                {pending.status === 'DONE'
                  ? 'The count and amount will be fixed and the payment date set to today.'
                  : 'This reopens the count and clears the payment date.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPending(null)}
                className="flex-1 rounded border border-gray-300 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-50 uppercase tracking-wide disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmMark}
                className="flex-1 rounded bg-[#2196F3] hover:bg-[#1E88E5] py-2 text-[13px] font-bold text-white uppercase tracking-wide disabled:opacity-60"
              >
                {busy ? 'Saving…' : pending.status === 'DONE' ? 'Yes, paid' : 'Yes, pending'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/** SuperAdmin: every franchise's bill totals for the month; click a row for its cards */
const MonthlyBillsOverview: React.FC<{ month: string; onOpen: (bill: MonthlyBill, name: string) => void }> = ({ month, onOpen }) => {
  const { data: bills = [], isLoading, isError, error } = useQuery({
    queryKey: ['monthly-bills-overview', month],
    queryFn: () => getMonthlyBillsOverview(toQuery(month)),
  });
  const { data: franchises = [] } = useGetFranchises();
  const total = bills.reduce((s, b) => s + b.totalAmount, 0);
  const paid = bills.reduce((s, b) => s + (isPartPaid(b.newCards) ? b.newCards.amount : 0) + (isPartPaid(b.renewals) ? b.renewals.amount : 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Franchises', String(bills.length), 'text-[#212121]'],
          ['Total amount', rupees(total), 'text-[#212121]'],
          ['Paid', rupees(paid), 'text-[#2E7D32]'],
          ['Pending', rupees(total - paid), 'text-[#D32F2F]'],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded border border-[#E0E0E0] bg-white px-4 py-3">
            <div className="text-[12px] text-gray-500">{label}</div>
            <div className={`text-[18px] font-bold ${tone}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded border border-[#E0E0E0] bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#2196F3] text-white">
              {['Bill No', 'Franchise', 'New Cards', 'Amount', 'Status', 'Renewals', 'Amount', 'Status', 'Total'].map((h, i) => (
                <th key={`${h}-${i}`} className={`${thClass} ${h === 'Total' ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-[13px] text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading bills…
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-[13px] text-red-600">{apiError(error, 'Failed to load the bills')}</td>
              </tr>
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-[13px] text-gray-500">No franchise bills for this month.</td>
              </tr>
            ) : (
              bills.map((b, i) => (
                <tr
                  key={`${b.franchise?.id || b.billNo}-${i}`}
                  onClick={() => b.franchise?.id && onOpen(b, franchiseLabel(b, franchises))}
                  className="border-b border-[#E0E0E0] hover:bg-blue-50/50 cursor-pointer"
                >
                  <td className={`${tdClass} font-medium text-[#2196F3] whitespace-nowrap`}>{b.billNo || '-'}</td>
                  <td className={`${tdClass} font-medium`}>{franchiseLabel(b, franchises)}</td>
                  <td className={tdClass}>{b.newCards.count}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>{rupees(b.newCards.amount)}</td>
                  <td className={tdClass}><StatusPill part={b.newCards} /></td>
                  <td className={tdClass}>{b.renewals.count}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>{rupees(b.renewals.amount)}</td>
                  <td className={tdClass}><StatusPill part={b.renewals} /></td>
                  <td className={`${tdClass} text-right font-bold whitespace-nowrap`}>{rupees(b.totalAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/** SuperAdmin: monthly report of the businesses it added directly (no franchise); report only */
const DirectMonthlyReport: React.FC<{ month: string }> = ({ month }) => {
  const { data: report, isLoading, isError, error } = useQuery({
    queryKey: ['monthly-bill-direct', month],
    queryFn: () => getDirectMonthlyReport(toQuery(month)),
  });

  if (isLoading) {
    return (
      <div className="py-10 text-center text-[13px] text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading report…
      </div>
    );
  }
  if (isError || !report) {
    return <div className="py-10 text-center text-[13px] text-red-600">{apiError(error, 'Failed to load the report')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Month · Rate', `${report.monthLabel || month} · ${rupees(report.rate)}/card`],
          ['New cards', `${report.newCards.count} · ${rupees(report.newCards.amount)}`],
          ['Renewals', `${report.renewals.count} · ${rupees(report.renewals.amount)}`],
          ['Total amount', rupees(report.totalAmount)],
        ].map(([label, value]) => (
          <div key={label} className="rounded border border-[#E0E0E0] bg-white px-4 py-3 min-w-0">
            <div className="text-[12px] text-gray-500">{label}</div>
            <div className="text-[16px] font-bold text-[#212121] truncate">{value}</div>
          </div>
        ))}
      </div>
      <BillPartSection title="Card Details" part={report.newCards} rate={report.rate} kind="new" canMark={false} busy={false} onMark={() => {}} />
      <BillPartSection title="Renewal Cards Details" part={report.renewals} rate={report.rate} kind="renewal" canMark={false} busy={false} onMark={() => {}} />
    </div>
  );
};

/** Plan bills from the transactions API (one bill per plan selected) */
const PlanTransactions: React.FC = () => {
  const { data: billsPage, isLoading, isError, error } = useQuery({
    queryKey: ['transactions-recent'],
    queryFn: () => getTransactions({ page: 1, limit: RECENT_BILLS }),
  });
  const bills = billsPage?.rows || [];

  return (
    <div className="overflow-hidden rounded border border-[#E0E0E0] bg-white">
      <div className="flex items-center gap-2 bg-[#2196F3] px-4 py-2.5 text-white">
        <Receipt className="h-4 w-4" />
        <span className="text-[15px] font-medium tracking-wide">Recent Transactions</span>
        {billsPage && <span className="ml-auto text-[12px] text-white/80">{billsPage.total} bill{billsPage.total === 1 ? '' : 's'}</span>}
      </div>

      <div className="p-4">
        <div className="overflow-x-auto rounded border border-[#E0E0E0]">
          <table className="w-full text-left text-[13px] font-['Roboto',Helvetica,Arial,sans-serif]">
            <thead className="bg-gray-50 border-b border-[#E0E0E0]">
              <tr className="text-gray-700 font-medium">
                <th className="px-3 py-2">Bill no</th>
                <th className="px-3 py-2">Business Name</th>
                <th className="px-3 py-2">Added By (Role)</th>
                <th className="px-3 py-2">Payment Status</th>
                <th className="px-3 py-2">Payment date</th>
                <th className="px-3 py-2">Valid from - Valid to</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Payment Through</th>
                <th className="px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-4 text-center text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading transactions…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="px-3 py-4 text-center text-red-600">{apiError(error, 'Failed to load transactions')}</td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-4 text-center text-gray-400">
                    No transactions yet. A bill is added each time a plan is selected (Upgrade).
                  </td>
                </tr>
              ) : (
                bills.map((row) => {
                  const paid = String(row.paymentStatus).toUpperCase() === 'DONE';
                  return (
                    <tr key={row.id || row.billNo} className="border-b border-[#E0E0E0] hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-[#2196F3]">{row.billNo}</td>
                      <td className="px-3 py-2 font-medium text-[#212121]">{row.businessName || '-'}</td>
                      <td className="px-3 py-2 text-[#212121]">{row.addedBy?.label || row.addedBy?.fullname || '-'}</td>
                      <td className={`px-3 py-2 font-medium ${paid ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>{paid ? 'PAID' : 'PENDING'}</td>
                      <td className="px-3 py-2 text-[#212121] whitespace-nowrap">{billDate(row.paymentDate)}</td>
                      <td className="px-3 py-2 text-[#212121] whitespace-nowrap">{billDate(row.validFrom)} - {billDate(row.validTo)}</td>
                      <td className="px-3 py-2 text-[#212121]">{row.planLabel || '-'}</td>
                      <td className="px-3 py-2 text-[#212121]">{row.paymentMethod || '-'}</td>
                      <td className="px-3 py-2 font-bold text-[#212121]">{rupees(row.amount)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/** Billing Report: franchise monthly bills (new cards + renewals) and plan transactions */
export const BillingManagement: React.FC = () => {
  const franchiseSession = isFranchiseUser();
  const [tab, setTab] = useState<'monthly' | 'direct' | 'transactions'>('monthly');
  const [month, setMonth] = useState(thisMonth());
  const [openBill, setOpenBill] = useState<{ bill: MonthlyBill; name: string } | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const tabLabel =
    tab === 'transactions'
      ? 'Plan Transactions'
      : tab === 'direct'
        ? 'Direct Businesses'
        : franchiseSession
          ? 'Monthly Bill'
          : openBill
            ? `Monthly Bill · ${openBill.name}`
            : 'Franchise Monthly Bills';
  const printTitle = `Billing Report · ${tabLabel}${tab === 'transactions' ? '' : ` · ${monthLabel}`}`;

  const tabClass = (active: boolean) =>
    `pb-2.5 text-[14px] font-medium border-b-2 transition-colors ${
      active ? 'border-[#2196F3] text-[#2196F3]' : 'border-transparent text-gray-600 hover:text-black'
    }`;

  return (
    <div className="w-full space-y-4 font-['Roboto',Helvetica,Arial,sans-serif]">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E0E0E0]">
        <h1 className="text-[18px] font-medium text-[#212121] flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#2196F3]" /> Billing Report
        </h1>
        <div className="flex items-center gap-2">
        {tab !== 'transactions' && (
          <label className="relative flex items-center">
            <CalendarDays className="absolute left-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="month"
              value={month}
              max={thisMonth()}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="rounded border border-gray-300 pl-8 pr-3 py-1.5 text-[13px] text-gray-800 bg-white focus:border-[#2196F3] focus:outline-none"
            />
          </label>
        )}
          <button
            type="button"
            onClick={() => printElement(reportRef.current, printTitle)}
            className="flex items-center gap-1.5 rounded bg-[#2196F3] hover:bg-[#1E88E5] px-3.5 py-1.5 text-[13px] font-medium text-white"
            title="Print or save as PDF"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="border-b border-[#E0E0E0]">
        <div className="flex gap-x-8 gap-y-2 flex-wrap">
          <button type="button" onClick={() => setTab('monthly')} className={tabClass(tab === 'monthly')}>
            {franchiseSession ? 'Monthly Bill' : 'Franchise Monthly Bills'}
          </button>
          {!franchiseSession && (
            <button type="button" onClick={() => setTab('direct')} className={tabClass(tab === 'direct')}>
              Direct Businesses
            </button>
          )}
          <button type="button" onClick={() => setTab('transactions')} className={tabClass(tab === 'transactions')}>
            Plan Transactions
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-4">
        {/* Heading only on the printout */}
        <div className="hidden print:block pb-2 border-b border-[#E0E0E0]">
          <h1 className="text-[18px] font-bold text-[#212121]">{printTitle}</h1>
          <p className="text-[11px] text-gray-500">Printed {new Date().toLocaleString('en-GB')}</p>
        </div>
      {tab === 'monthly' &&
        (franchiseSession ? (
          <FranchiseBillDetail month={month} />
        ) : openBill?.bill.franchise?.id ? (
          <FranchiseBillDetail franchiseId={openBill.bill.franchise.id} franchiseName={openBill.name} month={month} onBack={() => setOpenBill(null)} />
        ) : (
          <MonthlyBillsOverview month={month} onOpen={(bill, name) => setOpenBill({ bill, name })} />
        ))}
      {tab === 'direct' && !franchiseSession && <DirectMonthlyReport month={month} />}
      {tab === 'transactions' && <PlanTransactions />}
      </div>
    </div>
  );
};

export default BillingManagement;
