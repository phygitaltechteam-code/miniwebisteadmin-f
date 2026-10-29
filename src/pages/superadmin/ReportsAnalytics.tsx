import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, Loader2, Search } from 'lucide-react';
import { getTransactions, TransactionRow } from '@/lib/api/superadmin/transaction';

/** Bills fetched per range (the report sums all of them) and rows shown per table page */
const FETCH_LIMIT = 1000;
const PAGE_SIZE = 20;


const formatDate = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const rupees = (n?: number) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;
const isPaid = (row: TransactionRow) => String(row.paymentStatus).toUpperCase() === 'DONE';

/** Payment report: plan bills between From and To (transactions API) */
export const ReportsAnalytics: React.FC = () => {
  // No dates = every bill; pick From / To to narrow it down
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['transactions-report', from, to, status],
    // Whole days: From at 00:00:00, To at 23:59:59 (a bare date would cut To off at midnight)
    queryFn: () =>
      getTransactions({
        from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
        paymentStatus: status || undefined,
        page: 1,
        limit: FETCH_LIMIT,
      }),
    enabled: !(from && to && from > to),
  });

  // Search runs on the loaded bills (bill no, business, plan, payment method, added by)
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = data?.rows || [];
    if (!q) return all;
    return all.filter((r) =>
      [r.billNo, r.businessName, r.planLabel, r.paymentMethod, r.addedBy?.label || r.addedBy?.fullname]
        .some((v) => String(v || '').toLowerCase().includes(q)),
    );
  }, [data, search]);

  const totals = useMemo(() => {
    const paid = rows.filter(isPaid).reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const all = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return { count: rows.length, all, paid, pending: all - paid };
  }, [rows]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const exportCsv = () => {
    const header = ['Bill No', 'Business', 'Added By', 'Status', 'Payment Date', 'Valid From', 'Valid To', 'Plan', 'Payment Through', 'Amount'];
    const lines = rows.map((r) => [
      r.billNo,
      r.businessName || '',
      r.addedBy?.label || r.addedBy?.fullname || '',
      isPaid(r) ? 'PAID' : 'PENDING',
      formatDate(r.paymentDate),
      formatDate(r.validFrom),
      formatDate(r.validTo),
      r.planLabel || '',
      r.paymentMethod || '',
      String(Number(r.amount) || 0),
    ]);
    const csv = [header, ...lines].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-report_${from || 'start'}_to_${to || 'today'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fieldClass =
    'w-full rounded border border-gray-300 px-3 pt-3 pb-2 text-[14px] text-gray-800 bg-white focus:border-[#2196F3] focus:outline-none';
  const labelClass = 'absolute left-2.5 top-1 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500';

  return (
    <div className="w-full space-y-4 font-['Roboto',Helvetica,Arial,sans-serif]">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E0E0E0]">
        <div>
          <h1 className="text-[18px] font-medium text-[#212121] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#2196F3]" /> Payment Report
          </h1>
          <p className="text-[12px] text-gray-500">Plan bills for businesses and franchises</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="flex items-center gap-1.5 rounded bg-[#2196F3] hover:bg-[#1E88E5] px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters: From / To date, status, search */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative">
          <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={fieldClass} />
          <label className={labelClass}>From date</label>
        </div>
        <div className="relative">
          <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={fieldClass} />
          <label className={labelClass}>To date</label>
        </div>
        <div className="relative">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={fieldClass}>
            <option value="">All</option>
            <option value="DONE">Paid</option>
            <option value="PENDING">Pending</option>
          </select>
          <label className={labelClass}>Payment status</label>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Bill no, business, plan…"
            className={`${fieldClass} pl-9 py-2.5`}
          />
        </div>
      </div>

      {/* Totals for the range */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Bills', String(totals.count), 'text-[#212121]'],
          ['Total amount', rupees(totals.all), 'text-[#212121]'],
          ['Paid', rupees(totals.paid), 'text-[#2E7D32]'],
          ['Pending', rupees(totals.pending), 'text-[#D32F2F]'],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded border border-[#E0E0E0] bg-white px-4 py-3">
            <div className="text-[12px] text-gray-500">{label}</div>
            <div className={`text-[18px] font-bold ${tone}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Bills table */}
      <div className="overflow-x-auto rounded border border-[#E0E0E0] bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#2196F3] text-white">
              {['Bill No', 'Business', 'Added By', 'Status', 'Payment Date', 'Validity', 'Plan', 'Payment Through', 'Amount'].map((h) => (
                <th key={h} className={`px-3 py-2.5 text-[13px] font-medium whitespace-nowrap ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-[13px] text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading report…
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-[13px] text-red-600">
                  {(error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load the report'}
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-[13px] text-gray-500">{from || to ? 'No bills between these dates.' : 'No bills yet.'}</td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr key={r.id || r.billNo} className="border-b border-[#E0E0E0] hover:bg-gray-50 text-[13px] text-[#212121]">
                  <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{r.billNo}</td>
                  <td className="px-3 py-2.5 font-medium">{r.businessName || '-'}</td>
                  <td className="px-3 py-2.5 text-gray-600">{r.addedBy?.label || r.addedBy?.fullname || '-'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white ${isPaid(r) ? 'bg-[#4CAF50]' : 'bg-[#F44336]'}`}>
                      {isPaid(r) ? 'PAID' : 'PENDING'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(r.paymentDate)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(r.validFrom)} – {formatDate(r.validTo)}</td>
                  <td className="px-3 py-2.5">{r.planLabel || '-'}</td>
                  <td className="px-3 py-2.5">{r.paymentMethod || '-'}</td>
                  <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap">{rupees(r.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 text-[13px]">
          <button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40">
            Previous
          </button>
          <span className="text-gray-600">Page {currentPage} of {pageCount}</span>
          <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
