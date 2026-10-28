import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Eye,
  Share2,
  Users,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import toast from 'react-hot-toast';

export const ReportsAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');

  const topCategories = [
    { name: 'Electrical & Technical Services', count: 42, percentage: '36%' },
    { name: 'Health & Medical Clinics', count: 28, percentage: '24%' },
    { name: 'Food, Cafe & Catering', count: 22, percentage: '19%' },
    { name: 'Real Estate & Construction', count: 15, percentage: '13%' },
    { name: 'Retail & Fashion Stores', count: 9, percentage: '8%' },
  ];

  const handleExport = () => {
    toast.success('Generating and downloading Analytics Report (PDF)...');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Report & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Card view impressions, click conversions, and business expansion metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-xl border border-stroke p-1 bg-white text-xs">
            {(['7d', '30d', '90d', '1y'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  dateRange === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <GenericButton
            onClick={handleExport}
            className="!px-4 !py-2 !text-xs font-bold !bg-slate-900 shadow-md shadow-slate-900/20"
          >
            <Download className="w-3.5 h-3.5 mr-1 inline" />
            Export Report
          </GenericButton>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Card Views</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">1,24,850</div>
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            +24.6% impressions growth
          </span>
        </div>

        <div className="rounded-xl border border-stroke bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">WhatsApp & Calls</span>
            <Share2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">38,420</div>
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            30.7% CTA click-through rate
          </span>
        </div>

        <div className="rounded-xl border border-stroke bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">QR Code Scans</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">52,190</div>
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Physical card scans verified
          </span>
        </div>

        <div className="rounded-xl border border-stroke bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Customer Retention</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">94.8%</div>
          <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 mt-1">
            Annual plan renewal rate
          </span>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Categories Breakdown */}
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Top Business Categories Distribution
          </h3>
          <div className="space-y-4">
            {topCategories.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{cat.name}</span>
                  <span className="font-mono font-bold text-slate-500">
                    {cat.count} cards ({cat.percentage})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: cat.percentage }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources & Geographic Heat */}
        <div className="rounded-xl border border-stroke bg-white p-5 shadow-xs dark:border-strokedark dark:bg-boxdark flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Viewer Access Sources
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Direct links vs QR Code scans vs Social media shares
            </p>

            <div className="grid grid-cols-3 gap-3 text-center my-6">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <span className="text-xl font-black text-blue-600 block">58%</span>
                <span className="text-[11px] font-semibold text-slate-600">WhatsApp Shares</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                <span className="text-xl font-black text-purple-600 block">26%</span>
                <span className="text-[11px] font-semibold text-slate-600">QR Scans</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-xl font-black text-emerald-600 block">16%</span>
                <span className="text-[11px] font-semibold text-slate-600">Direct Web Links</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-stroke text-xs text-slate-600 flex items-center justify-between">
            <span>Overall engagement is healthy across all active digital cards.</span>
            <span className="font-bold text-blue-600 hover:underline cursor-pointer">Detailed log →</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
