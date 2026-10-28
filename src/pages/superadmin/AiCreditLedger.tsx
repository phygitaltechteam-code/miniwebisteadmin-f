import React, { useState } from 'react';
import {
  Sparkles,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import toast from 'react-hot-toast';

export const AiCreditLedger: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const transactions = [
    {
      id: 'TXN-8842',
      date: '2026-10-26 14:12',
      type: 'AI Business Bio Generation',
      business: 'Apex Electricals & Power',
      credits: -5,
      balance: 2450,
      status: 'SUCCESS',
    },
    {
      id: 'TXN-8841',
      date: '2026-10-25 18:30',
      type: 'Credit Pack Top Up',
      business: 'Franchise Central Allocation',
      credits: +500,
      balance: 2455,
      status: 'CREDITED',
    },
    {
      id: 'TXN-8840',
      date: '2026-10-24 11:05',
      type: 'AI Product Description Wizard',
      business: 'Royal Cafe & Bakery',
      credits: -10,
      balance: 1955,
      status: 'SUCCESS',
    },
    {
      id: 'TXN-8839',
      date: '2026-10-23 09:44',
      type: 'AI Logo & Theme Matching',
      business: 'Sunrise Health Clinic',
      credits: -15,
      balance: 1965,
      status: 'SUCCESS',
    },
    {
      id: 'TXN-8838',
      date: '2026-10-20 16:18',
      type: 'AI WhatsApp Marketing Copy',
      business: 'Metro Logistics Pvt Ltd',
      credits: -5,
      balance: 1980,
      status: 'SUCCESS',
    },
  ];

  const filtered = transactions.filter(
    (t) =>
      t.business.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-sky-600" />
            AI Credit Ledger
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Audit logs of AI bio creation, copywriting, and token credit allocations
          </p>
        </div>

        <GenericButton
          onClick={() => toast.success('Add AI Credits modal opened')}
          className="!px-4 !py-2.5 !text-xs font-bold !bg-sky-600 hover:!bg-sky-500 shadow-md shadow-sky-600/25"
        >
          <Plus className="w-4 h-4 mr-1 inline" />
          Add AI Credits
        </GenericButton>
      </div>

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Available Credit Balance
            </span>
            <Coins className="w-5 h-5 text-sky-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">2,450</div>
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready for instant generation
          </span>
        </div>

        <div className="rounded-xl border border-stroke bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Consumed This Month
            </span>
            <ArrowUpRight className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">345</div>
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-1">
            Across 28 businesses
          </span>
        </div>

        <div className="rounded-xl border border-stroke bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Bonus Allocated
            </span>
            <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">1,000</div>
          <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 mt-1">
            Franchise welcome bonus
          </span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="w-full bg-white">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ledger by transaction or business..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stroke bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <span className="text-xs text-gray-500 hidden sm:inline">
            Showing latest AI credit activity
          </span>
        </div>

        <div className="overflow-x-auto rounded border border-[#E0E0E0] shadow-xs">
          <table className="w-full text-left font-['Roboto',Helvetica,Arial,sans-serif]">
            <thead>
              <tr className="bg-[#2196F3] text-white border-none select-none">
                <th className="px-3 py-2.5 text-[14px] font-medium text-white">Transaction ID</th>
                <th className="px-3 py-2.5 text-[14px] font-medium text-white">Date & Time</th>
                <th className="px-3 py-2.5 text-[14px] font-medium text-white">Operation / Type</th>
                <th className="px-3 py-2.5 text-[14px] font-medium text-white">Business</th>
                <th className="px-3 py-2.5 text-[14px] font-medium text-white">Credits</th>
                <th className="px-3 py-2.5 text-[14px] font-medium text-white">Balance After</th>
                <th className="px-3 py-2.5 text-[14px] font-medium text-white">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#F5F5F5] transition-colors border-b border-[#E0E0E0]">
                  <td className="px-3 py-2.5 text-[14px] font-medium text-[#1976D2]">{item.id}</td>
                  <td className="px-3 py-2.5 text-[14px] text-[#000000DE]">{item.date}</td>
                  <td className="px-3 py-2.5 text-[14px] font-medium text-[#000000DE]">{item.type}</td>
                  <td className="px-3 py-2.5 text-[14px] text-[#000000DE]">{item.business}</td>
                  <td
                    className={`px-3 py-2.5 text-[14px] font-bold ${
                      item.credits > 0 ? 'text-[#4CAF50]' : 'text-[#F44336]'
                    }`}
                  >
                    {item.credits > 0 ? `+${item.credits}` : item.credits}
                  </td>
                  <td className="px-3 py-2.5 text-[14px] font-bold text-[#000000DE]">{item.balance}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block px-3 py-0.5 text-[12px] font-medium rounded-full text-white ${
                        item.status === 'CREDITED'
                          ? 'bg-[#2196F3]'
                          : 'bg-[#4CAF50]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AiCreditLedger;
