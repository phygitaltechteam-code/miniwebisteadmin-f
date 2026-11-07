import React from 'react';
import {
  Briefcase,
  Building2,
  CreditCard,
  TrendingUp,
  Layers,
  ArrowUpRight,
  Eye,
} from 'lucide-react';
import { useGetAdmin } from '@/lib/react-query/superadmin/admin';
import { useGetCategories } from '@/lib/react-query/superadmin/category';
import { useGetFranchises } from '@/lib/react-query/superadmin/franchise';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useAdminWiseVisits, useVisitOverview } from '@/lib/react-query/visits';
import { VisitStatTiles, fmtCount, fmtLastVisit } from '@/components/VisitStatTiles';

interface SuperAdminDashboardProps {
  onNavigate: (view: any) => void;
  userRole?: string;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onNavigate,
  userRole,
}) => {
  const isFranchise = userRole?.trim().toUpperCase() === 'FRANCHISE';
  const { data: adminList = [] } = useGetAdmin();
  const { data: categoryList = [] } = useGetCategories();
  const { data: franchiseList = [] } = useGetFranchises();

  // Guest visits on the cards (franchise / employee: only their own admins, via the axios rewrite)
  const visitOverview = useVisitOverview(30);
  const topVisited = useAdminWiseVisits({ limit: 5, sortBy: 'visits' });

  const totalAdmins = Array.isArray(adminList) ? adminList.length : 0;
  const totalCategories = Array.isArray(categoryList) ? categoryList.length : 0;
  const totalFranchises = Array.isArray(franchiseList) ? franchiseList.length : 0;

  const stats = [
    {
      title: isFranchise ? 'My Admin Accounts' : 'Total Businesses',
      value: totalAdmins,
      change: '+12% active',
      icon: Briefcase,
      action: () => onNavigate('admins'),
    },
    ...(!isFranchise
      ? [
          {
            title: 'Franchisee Partners',
            value: totalFranchises,
            change: '+4 partners',
            icon: Building2,
            action: () => onNavigate('franchise'),
          },
          {
            title: 'Active Categories',
            value: totalCategories,
            change: 'Global list',
            icon: Layers,
            action: () => onNavigate('categories'),
          },
        ]
      : []),
    {
      title: 'Digital Cards Live',
      value: totalAdmins,
      change: '100% online',
      icon: CreditCard,
      action: () => onNavigate('admins'),
    },
  ];

  return (
    <div className="space-y-4 font-['Roboto',Helvetica,Arial,sans-serif]">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E0E0E0]">
        <div>
          <h1 className="text-[18px] font-medium text-[#000000DE]">
            {isFranchise ? 'Franchise Partner Overview' : 'Dashboard Overview'}
          </h1>
          <p className="text-[13px] text-gray-500">
            Digi Web Card portal metrics and quick management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GenericButton
            onClick={() => onNavigate('admins')}
            className="!bg-[#2196F3] hover:!bg-[#1E88E5] text-white !px-4 !py-1.5 !text-[14px] font-medium shadow-none"
          >
            + Add Business
          </GenericButton>
          {!isFranchise && (
            <GenericButton
              onClick={() => onNavigate('franchise')}
              className="!bg-[#2196F3] hover:!bg-[#1E88E5] text-white !px-4 !py-1.5 !text-[14px] font-medium shadow-none"
            >
              + Add Franchise
            </GenericButton>
          )}
        </div>
      </div>

      {/* Clean Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              onClick={stat.action}
              className="cursor-pointer border border-[#E0E0E0] bg-white p-4 rounded hover:shadow-xs transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-500 font-medium">
                  {stat.title}
                </span>
                <div className="w-8 h-8 rounded bg-[#E3F2FD] flex items-center justify-center text-[#1976D2]">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#000000DE]">
                  {stat.value}
                </span>
                <span className="text-[12px] font-medium text-[#4CAF50] flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Card visits: totals + most visited businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="border border-[#E0E0E0] bg-[#FAFAFA] p-4 rounded lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-medium text-[#000000DE] flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#1976D2]" /> Card Visits
            </h3>
            {visitOverview.data && (
              <span className="text-[12px] text-gray-500">Last visit: {fmtLastVisit(visitOverview.data.lastVisitAt)}</span>
            )}
          </div>
          {visitOverview.isLoading ? (
            <div className="py-6 text-center text-[13px] text-gray-400">Loading visits…</div>
          ) : visitOverview.isError || !visitOverview.data ? (
            <div className="py-6 text-center text-[13px] text-gray-400">Visit counts are not available.</div>
          ) : (
            <VisitStatTiles stats={visitOverview.data} />
          )}
        </div>

        <div className="border border-[#E0E0E0] bg-white p-4 rounded">
          <h3 className="text-[14px] font-medium text-[#000000DE] mb-3">Most Visited Businesses</h3>
          {topVisited.isLoading ? (
            <div className="py-6 text-center text-[13px] text-gray-400">Loading…</div>
          ) : !topVisited.data || topVisited.data.rows.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-gray-400">No visits yet.</div>
          ) : (
            <ol className="divide-y divide-[#F0F0F0]">
              {topVisited.data.rows.map((r, i) => (
                <li key={r.adminId || i} className="flex items-center gap-2 py-2">
                  <span className="w-5 text-[12px] font-semibold text-gray-400 tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium text-[#000000DE] truncate">{r.businessName}</div>
                    <div className="text-[11.5px] text-gray-500 truncate">
                      Today {fmtCount(r.today)} · 7 days {fmtCount(r.last7Days)}
                      {r.franchiseName ? ` · ${r.franchiseName}` : ''}
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-[#1976D2] tabular-nums">{fmtCount(r.totalVisits)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Quick Launch & Recent Businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Launchpad */}
        <div className="border border-[#E0E0E0] bg-white p-4 rounded lg:col-span-1 space-y-2">
          <h3 className="text-[14px] font-medium text-[#000000DE] mb-2">
            Quick Actions
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('admins')}
            className="w-full flex items-center justify-between p-2.5 rounded border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors text-left text-[14px] text-[#000000DE]"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#1976D2]" />
              <span>All Businesses</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-400" />
          </button>

          {!isFranchise && (
            <button
              type="button"
              onClick={() => onNavigate('franchise')}
              className="w-full flex items-center justify-between p-2.5 rounded border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors text-left text-[14px] text-[#000000DE]"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#1976D2]" />
                <span>Franchisee List</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {!isFranchise && (
            <button
              type="button"
              onClick={() => onNavigate('categories')}
              className="w-full flex items-center justify-between p-2.5 rounded border border-[#E0E0E0] hover:bg-[#F5F5F5] transition-colors text-left text-[14px] text-[#000000DE]"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1976D2]" />
                <span>Category Master</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Recent Businesses Table */}
        <div className="border border-[#E0E0E0] bg-white p-4 rounded lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-medium text-[#000000DE]">
              Recent Businesses ({totalAdmins})
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('admins')}
              className="text-[13px] font-medium text-[#1976D2] hover:underline"
            >
              View all →
            </button>
          </div>

          <div className="overflow-x-auto rounded border border-[#E0E0E0]">
            <table className="w-full text-left font-['Roboto',Helvetica,Arial,sans-serif]">
              <thead>
                <tr className="bg-[#2196F3] text-white border-none select-none">
                  <th className="px-3 py-2 text-[14px] font-medium text-white">Business Name</th>
                  <th className="px-3 py-2 text-[14px] font-medium text-white">Contact</th>
                  <th className="px-3 py-2 text-[14px] font-medium text-white">Plan Amount</th>
                  <th className="px-3 py-2 text-[14px] font-medium text-white">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {Array.isArray(adminList) && adminList.length > 0 ? (
                  adminList.slice(0, 5).map((each: any, i: number) => {
                    const name = each.user?.fullname || each.fullname || 'Admin User';
                    const phone = each.user?.phoneNumber || each.phoneNumber || '-';
                    const price = each.amount || each.price ? `₹${each.amount || each.price}` : 'Free';
                    return (
                      <tr key={each.id || each._id || i} className="hover:bg-[#F5F5F5] border-b border-[#E0E0E0]">
                        <td className="px-3 py-2 text-[14px] font-medium text-[#000000DE]">{name}</td>
                        <td className="px-3 py-2 text-[14px] text-[#000000DE]">{phone}</td>
                        <td className="px-3 py-2 text-[14px] font-medium text-[#000000DE]">{price}</td>
                        <td className="px-3 py-2">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#4CAF50] text-white">
                            Subscribed
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400 text-[14px]">
                      No businesses registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
