import React from 'react';
import { Loader2, Receipt } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '@/lib/api/superadmin/transaction';

/** Bills shown in Recent Transactions (the Report page has the full list with dates) */
const RECENT_BILLS = 20;

const billDate = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Billing: the latest plan bills from the transactions API (one bill per plan selected) */
export const BillingManagement: React.FC = () => {
  const { data: billsPage, isLoading, isError, error } = useQuery({
    queryKey: ['transactions-recent'],
    queryFn: () => getTransactions({ page: 1, limit: RECENT_BILLS }),
  });
  const bills = billsPage?.rows || [];

  return (
    <div className="w-full space-y-4 font-['Roboto',Helvetica,Arial,sans-serif]">
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
                    <td colSpan={9} className="px-3 py-4 text-center text-red-600">
                      {(error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load transactions'}
                    </td>
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
                        <td className="px-3 py-2 font-bold text-[#212121]">₹{(Number(row.amount) || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingManagement;
