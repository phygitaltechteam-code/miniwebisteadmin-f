import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Building2,
  CreditCard,
  Eye,
  Layers,
  ArrowUpRight,
  Inbox,
  Loader2,
  UserCheck,
  Users,
} from 'lucide-react';
import { useGetAdmin } from '@/lib/react-query/superadmin/admin';
import { useGetCategories } from '@/lib/react-query/superadmin/category';
import { getPlatformStats } from '@/lib/api/superadmin/stats';
import { rebaseCardUrl } from '@/utils/cardUrl';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

interface SuperAdminDashboardProps {
  onNavigate: (view: any) => void;
  userRole?: string;
  /** Opens a business in the card forge (top businesses open on its Leads tab) */
  onOpenBusiness?: (adminId: string, businessName?: string) => void;
}

const fmt = (n: number) => n.toLocaleString('en-IN');

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onNavigate,
  userRole,
  onOpenBusiness,
}) => {
  const isFranchise = userRole?.trim().toUpperCase() === 'FRANCHISE';
  const { data: adminList = [] } = useGetAdmin();
  const { data: categoryList = [] } = useGetCategories();
  // Real totals from the server (the lists above only hold their first page)
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ['platform-stats', isFranchise ? 'franchise' : 'superadmin'],
    queryFn: getPlatformStats,
    staleTime: 60 * 1000,
    retry: false,
  });

  const totalCategories = Array.isArray(categoryList) ? categoryList.length : 0;
  const value = (n: number | undefined) =>
    statsLoading ? '…' : statsError || n === undefined ? '–' : fmt(n);

  const tiles = [
    {
      title: isFranchise ? 'My Businesses' : 'Total Businesses',
      value: value(stats?.businesses.total),
      detail: stats
        ? `${fmt(stats.businesses.active)} active · ${fmt(stats.businesses.expiringSoon)} expiring · ${fmt(stats.businesses.expired)} expired`
        : '',
      icon: Briefcase,
      action: () => onNavigate('admins'),
    },
    ...(!isFranchise
      ? [
          {
            title: 'Franchisee Partners',
            value: value(stats?.franchises?.total),
            detail: '',
            icon: Building2,
            action: () => onNavigate('franchise'),
          },
          {
            title: 'Active Categories',
            value: fmt(totalCategories),
            detail: 'Global list',
            icon: Layers,
            action: () => onNavigate('categories'),
          },
        ]
      : []),
    {
      title: 'Leads',
      value: value(stats?.leads.total),
      detail: stats ? `${fmt(stats.leads.last30Days)} in 30 days · ${fmt(stats.leads.won)} won` : '',
      icon: Users,
      action: undefined,
    },
    {
      title: 'Customers',
      value: value(stats?.customers.total),
      detail: '',
      icon: UserCheck,
      action: undefined,
    },
    {
      title: 'Card Views (30 days)',
      value: value(stats?.cardViews30d),
      detail: '',
      icon: Eye,
      action: undefined,
    },
    {
      title: 'Enquiries (30 days)',
      value: value(stats?.enquiries30d),
      detail: '',
      icon: Inbox,
      action: undefined,
    },
    {
      title: 'Digital Cards Live',
      value: value(stats?.businesses.active),
      detail: stats && stats.businesses.total
        ? `${Math.round((stats.businesses.active / stats.businesses.total) * 100)}% of businesses`
        : '',
      icon: CreditCard,
      action: () => onNavigate('admins'),
    },
  ];

  const topBusinesses = stats?.topBusinesses ?? [];
  const openBusiness = (adminId: string, businessName?: string) => {
    if (!onOpenBusiness || !adminId) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'leads');
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      /* opens on the card tab */
    }
    onOpenBusiness(adminId, businessName);
  };

  return (
    <div className="space-y-4 font-['Roboto',Helvetica,Arial,sans-serif]">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E0E0E0]">
        <div>
          <h1 className="text-[18px] font-medium text-[#000000DE]">
            {isFranchise ? 'Franchise Partner Overview' : 'Dashboard Overview'}
          </h1>
          <p className="text-[13px] text-[#6B7280]">
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

      {statsError && (
        <p className="rounded border border-[#FFE082] bg-[#FFF8E1] px-3 py-2 text-[13px] text-[#8D6E00]">
          Couldn't load the totals right now. Refresh the page to try again.
        </p>
      )}

      {/* Clean Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              onClick={stat.action}
              className={`${stat.action ? 'cursor-pointer hover:shadow-xs' : ''} border border-[#E0E0E0] bg-white p-4 rounded transition-all`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#6B7280] font-medium">
                  {stat.title}
                </span>
                <div className="w-8 h-8 rounded bg-[#E3F2FD] flex items-center justify-center text-[#1976D2]">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-0.5">
                <span className="text-2xl font-bold text-[#000000DE]">
                  {stat.value}
                </span>
                {stat.detail && (
                  <span className="text-[12px] font-medium text-[#6B7280]">
                    {stat.detail}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Launch & Top / Recent Businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Launchpad */}
        <div className="border border-[#E0E0E0] bg-white p-4 rounded lg:col-span-1 space-y-2 self-start">
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
            <ArrowUpRight className="w-4 h-4 text-[#9CA3AF]" />
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
              <ArrowUpRight className="w-4 h-4 text-[#9CA3AF]" />
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
              <ArrowUpRight className="w-4 h-4 text-[#9CA3AF]" />
            </button>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4 min-w-0">
          {/* Top businesses by leads */}
          <div className="border border-[#E0E0E0] bg-white p-4 rounded">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-medium text-[#000000DE]">
                Top Businesses by Leads
              </h3>
              {statsLoading && <Loader2 className="w-4 h-4 animate-spin text-[#9CA3AF]" />}
            </div>
            <div className="overflow-x-auto rounded border border-[#E0E0E0]">
              <table className="w-full text-left font-['Roboto',Helvetica,Arial,sans-serif]">
                <thead>
                  <tr className="bg-[#2196F3] text-white border-none select-none">
                    <th className="px-3 py-2 text-[14px] font-medium text-white">Business</th>
                    <th className="px-3 py-2 text-[14px] font-medium text-white text-right">Leads</th>
                    <th className="px-3 py-2 text-[14px] font-medium text-white text-right">Views (30 days)</th>
                    <th className="px-3 py-2 text-[14px] font-medium text-white">Card</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {topBusinesses.length > 0 ? (
                    topBusinesses.map((b, i) => {
                      const link = b.cardLink ? rebaseCardUrl(b.cardLink) : '';
                      return (
                        <tr
                          key={b.adminId || i}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('a')) return;
                            openBusiness(b.adminId, b.businessName);
                          }}
                          className={`${onOpenBusiness ? 'cursor-pointer' : ''} hover:bg-[#F5F5F5] border-b border-[#E0E0E0]`}
                          title={onOpenBusiness ? 'Open this business’s leads' : undefined}
                        >
                          <td className="px-3 py-2 text-[14px] font-medium text-[#000000DE]">
                            {b.businessName || 'Unnamed business'}
                          </td>
                          <td className="px-3 py-2 text-[14px] text-[#000000DE] text-right">{fmt(b.leads)}</td>
                          <td className="px-3 py-2 text-[14px] text-[#000000DE] text-right">{fmt(b.views30d)}</td>
                          <td className="px-3 py-2 text-[13px]">
                            {link ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[#1976D2] hover:underline"
                              >
                                Open <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              '–'
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-[#9CA3AF] text-[14px]">
                        {statsLoading ? 'Loading…' : 'No leads captured yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Businesses Table */}
          <div className="border border-[#E0E0E0] bg-white p-4 rounded">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-medium text-[#000000DE]">
                Recent Businesses
                {stats ? ` (${fmt(stats.businesses.total)})` : ''}
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
                      <td colSpan={4} className="py-4 text-center text-[#9CA3AF] text-[14px]">
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
    </div>
  );
};

export default SuperAdminDashboard;
