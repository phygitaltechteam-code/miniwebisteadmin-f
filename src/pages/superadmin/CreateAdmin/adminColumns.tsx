import React from 'react';
import { Edit2, Copy, Trash2, IndianRupee, Eye } from 'lucide-react';
import { Column } from '@/components/Forms/Table/GenericTable';
import StatusToggle from '@/components/Forms/StatusToggle';
import { AdminRow } from './schema';

interface ColumnHandlers {
  /** isActive returned by the toggle API, per admin id (wins over the list until it refreshes) */
  statusOverride: Record<string, boolean>;
  togglingId: string | null;
  onToggleStatus: (row: AdminRow, active: boolean) => void;
  onPayments: (row: AdminRow) => void;
  onEdit: (row: AdminRow) => void;
  onDelete: (row: AdminRow) => void;
  onCopy: (row: AdminRow) => void;
}

/** Columns of the All Businesses table */
export const buildAdminColumns = ({ statusOverride, togglingId, onToggleStatus, onPayments, onEdit, onDelete, onCopy }: ColumnHandlers): Column<AdminRow>[] => [
  {
    accessor: 'fullname',
    header: 'Business Name',
    sortable: true,
    className: 'font-bold text-[#212121] max-w-[160px]',
    render: (row) => (
      <span className="font-bold text-[#212121] text-[13px] line-clamp-2">
        {row.fullname}
      </span>
    ),
  },
  {
    accessor: 'contactDisplay',
    header: 'Reg. Phone/Email',
    className: 'max-w-[130px]',
    render: (row) => (
      <div className="text-[13px] leading-tight">
        <div className="font-semibold text-[#212121] tracking-wide">
          {row.phoneNumber || '-'}
        </div>
        {row.email && (
          <div className="text-[11px] text-gray-500 truncate">{row.email}</div>
        )}
      </div>
    ),
  },
  {
    accessor: 'categoryName',
    header: 'Category',
    sortable: true,
    className: 'text-[13px] max-w-[180px]',
    render: (row) => {
      const cats = row.categoryNames && row.categoryNames.length > 0 ? row.categoryNames : (row.categoryName && row.categoryName !== '-' ? [row.categoryName] : []);
      if (cats.length === 0) {
        return <span className="text-gray-400 text-[12px] italic">-</span>;
      }
      return (
        <div className="flex flex-wrap gap-1 items-center">
          {cats.map((c, i) => (
            <span
              key={i}
              className="inline-block px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] font-medium text-[11px] border border-[#BFDBFE] max-w-[160px] truncate"
              title={c}
            >
              {c}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    accessor: 'dateTime',
    header: 'Date & Time',
    sortable: true,
    className: 'max-w-[110px]',
    render: (row) => {
      const dt = row.dateTime || row.creationDate || '-';
      const parts = dt.split(', ');
      return (
        <div className="text-[12px] text-[#212121] leading-tight">
          <div className="font-medium">{parts[0]}</div>
          {parts[1] && <div className="text-gray-500 text-[11px]">{parts[1]}</div>}
        </div>
      );
    },
  },
  {
    accessor: 'madeBy',
    header: 'Added By (Role)',
    className: 'max-w-[140px]',
    render: (row) => {
      const namePart = row.madeBy.split(' (')[0];
      const rolePart = row.madeBy.includes('(') ? `(${row.madeBy.split('(')[1]}` : '';
      return (
        <div className="text-[12px] text-[#212121] leading-tight">
          <div className="font-medium truncate">{namePart}</div>
          {rolePart && <div className="text-gray-500 text-[11px] truncate">{rolePart}</div>}
        </div>
      );
    },
  },
  {
    accessor: 'subscriptionStatus',
    header: 'Subscription Status',
    className: 'text-center w-28',
    render: (row) => {
      const isSubscribed = row.subscriptionStatus === 'Subscribed';
      return (
        <span
          className={`inline-block whitespace-nowrap px-2.5 py-0.5 text-[11px] font-medium rounded-full text-white ${
            isSubscribed ? 'bg-[#4CAF50]' : 'bg-[#F44336]'
          }`}
        >
          {row.subscriptionStatus}
        </span>
      );
    },
  },
  {
    accessor: 'totalVisits',
    header: 'Visits',
    sortable: true,
    className: 'text-center w-20',
    render: (row) => (
      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#212121] tabular-nums" title="Guest visits on this card">
        <Eye className="w-3.5 h-3.5 text-gray-400" />
        {row.totalVisits.toLocaleString('en-IN')}
      </span>
    ),
  },
  {
    accessor: (row) => (row.isActive ? 'Active' : 'Inactive'),
    header: 'Status',
    className: 'text-center w-28',
    render: (row) => {
      const active = statusOverride[row.id] ?? row.isActive;
      return (
        <StatusToggle
          active={active}
          name={row.fullname}
          disabled={togglingId === row.id}
          onToggle={() => onToggleStatus(row, active)}
        />
      );
    },
  },
  {
    header: 'Actions',
    accessor: (row) => row.id,
    className: 'text-right min-w-[140px]',
    // Payments, Edit, Delete, Copy card (row click still opens the card builder)
    render: (row) => (
      <div
        className="flex items-center justify-end gap-1 no-row-click"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          title="Projects & Payments"
          onClick={() => onPayments(row)}
          className="p-1.5 rounded text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
        >
          <IndianRupee className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Edit Business"
          onClick={() => onEdit(row)}
          className="p-1.5 rounded text-gray-600 hover:text-[#2196F3] hover:bg-blue-50 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Delete Business"
          onClick={() => onDelete(row)}
          className="p-1.5 rounded text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Copy Card"
          onClick={() => onCopy(row)}
          className="p-1.5 rounded text-gray-600 hover:text-[#2196F3] hover:bg-blue-50 transition-colors"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    ),
  },
];
