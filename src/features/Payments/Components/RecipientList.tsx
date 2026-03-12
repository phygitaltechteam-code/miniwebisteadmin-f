/*eslint-disable*/
import React, {useState} from 'react';
import {Receipt, Star, Clock, XCircle, CheckCircle} from 'lucide-react';
import {useGetBeneficiary} from '@/lib/react-query/beneficiary';
import {useNavigate} from '@tanstack/react-router';

interface RecipientListProps {
  searchQuery: string;
}

const RecipientList: React.FC<RecipientListProps> = ({searchQuery}) => {
  const {data: allBeneficiary} = useGetBeneficiary();
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string>('approved');

  const getStatusInfo = (recipient: any) => {
    let status = 'pending';
    let statusColor = '';
    let statusText = '';
    let icon = null;

    // Determine status based on the flags returned by the API
    if (recipient.isRejected === true) {
      status = 'rejected';
    } else if (recipient.isVerified === true) {
      status = 'approved';
    } else {
      status = 'pending';
    }

    switch (status) {
      case 'approved':
        statusColor = 'bg-green-100 text-green-800 border-green-200';
        statusText = 'Approved';
        icon = <CheckCircle className="h-3 w-3 text-green-600" />;
        break;
      case 'rejected':
        statusColor = 'bg-red-100 text-red-800 border-red-200';
        statusText = 'Rejected';
        icon = <XCircle className="h-3 w-3 text-red-600" />;
        break;
      case 'pending':
      default:
        statusColor = 'bg-amber-100 text-amber-800 border-amber-200';
        statusText = 'Pending';
        icon = <Clock className="h-3 w-3 text-amber-600" />;
        break;
    }

    return {status, statusText, statusColor, icon};
  };

  // Filter recipients based on search query and selected status
  const filteredRecipients =
    allBeneficiary?.filter((recipient: any) => {
      const matchesSearch =
        recipient?.fullName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        recipient?.accountNumber
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      if (selectedStatus === 'all') return matchesSearch;

      const {status} = getStatusInfo(recipient);
      return matchesSearch && status === selectedStatus;
    }) || [];

  // Sort recipients: approved first, then pending, then rejected, then alphabetically by name
  const sortedRecipients = [...filteredRecipients].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      approved: 1,
      verified: 1,
      pending: 2,
      rejected: 3,
      declined: 3,
    };
    const statusA = getStatusInfo(a).status;
    const statusB = getStatusInfo(b).status;

    const orderA = statusOrder[statusA] || 4;
    const orderB = statusOrder[statusB] || 4;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // If same status, sort alphabetically by name
    return (a.fullName || '').localeCompare(b.fullName || '');
  });

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleRecipientClick = (recipient: any) => {
    const {status} = getStatusInfo(recipient);

    switch (status) {
      case 'approved':
        navigate({
          to: `/payment/send/${recipient.id}`,
          state: {recipient},
        });
        break;
      case 'pending':
        navigate({
          to: '/beneficiary/statuspending',
          state: {recipient},
        });
        break;
      case 'rejected':
        navigate({
          to: '/beneficiary/statusrejected',
          state: {recipient},
        });
        break;
      default:
        navigate({to: `/updatebeneficiary/${recipient?.id}`});
    }
  };

  return (
    <div className="mt-2 min-h-[500px] rounded-t-3xl bg-white pb-24 shadow-sm lg:rounded-lg lg:pb-6">
      <div className="px-5 pb-2 pt-6 lg:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-900 text-lg font-bold lg:text-xl">
            Recent Recipients
          </h2>
          <div className="text-gray-500 text-xs lg:text-sm">
            {sortedRecipients.length}{' '}
            {sortedRecipients.length === 1 ? 'recipient' : 'recipients'}
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="mt-4 flex flex-wrap gap-2 lg:gap-3">
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors lg:px-4 lg:py-2 lg:text-sm ${
              selectedStatus === 'all'
                ? 'border border-blue-200 bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedStatus('all')}
          >
            All
          </button>
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors lg:px-4 lg:py-2 lg:text-sm ${
              selectedStatus === 'pending'
                ? 'border border-amber-200 bg-amber-100 text-amber-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedStatus('pending')}
          >
            Pending
          </button>
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors lg:px-4 lg:py-2 lg:text-sm ${
              selectedStatus === 'approved'
                ? 'border border-green-200 bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedStatus('approved')}
          >
            Approved
          </button>
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors lg:px-4 lg:py-2 lg:text-sm ${
              selectedStatus === 'rejected'
                ? 'border border-red-200 bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedStatus('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {sortedRecipients.length > 0 ? (
          sortedRecipients.map((recipient: any) => {
            const {statusText, statusColor, icon} = getStatusInfo(recipient);

            return (
              <div
                key={recipient?.id}
                onClick={() => handleRecipientClick(recipient)}
                className="hover:bg-gray-50 active:bg-gray-100 flex cursor-pointer items-center justify-between border-b border-stroke p-4 transition-colors last:border-0 lg:p-5"
              >
                <div className="flex items-center gap-4 lg:gap-5">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent bg-blue-100 text-xl font-bold text-blue-600 group-hover:border-primary/10 lg:h-12 lg:w-12 lg:text-2xl">
                      {getInitials(recipient?.fullName)}
                    </div>
                    {/* Status icon overlay */}
                    <div
                      className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border lg:h-6 lg:w-6 ${statusColor}`}
                    >
                      {icon}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <h3 className="text-gray-900 text-base font-bold lg:text-lg">
                        {recipient?.fullName}
                      </h3>
                    </div>
                    <p className="text-gray-500 text-sm lg:text-base">
                      {recipient?.accountNumber}
                    </p>
                    {status === 'rejected' && recipient?.rejectionReason && (
                      <p className="mt-1 text-xs text-red-500">
                        Reason: {recipient.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center lg:p-16">
            {selectedStatus === 'all' ? (
              <>
                <div className="bg-gray-100 mb-4 flex h-16 w-16 items-center justify-center rounded-full lg:h-20 lg:w-20">
                  <Receipt className="text-gray-400 h-8 w-8 lg:h-10 lg:w-10" />
                </div>
                <h3 className="text-gray-700 mb-2 text-lg font-medium lg:text-xl">
                  No recipients found
                </h3>
                <p className="text-gray-500 max-w-xs text-sm lg:max-w-sm lg:text-base">
                  {searchQuery
                    ? 'No recipients match your search. Try a different search term.'
                    : 'Add beneficiaries to see them here.'}
                </p>
              </>
            ) : (
              <>
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full lg:h-20 lg:w-20 ${
                    selectedStatus === 'approved'
                      ? 'bg-green-100'
                      : selectedStatus === 'rejected'
                        ? 'bg-red-100'
                        : 'bg-amber-100'
                  }`}
                >
                  {selectedStatus === 'approved' ? (
                    <CheckCircle className="h-8 w-8 text-green-600 lg:h-10 lg:w-10" />
                  ) : selectedStatus === 'rejected' ? (
                    <XCircle className="h-8 w-8 text-red-600 lg:h-10 lg:w-10" />
                  ) : (
                    <Clock className="h-8 w-8 text-amber-600 lg:h-10 lg:w-10" />
                  )}
                </div>
                <h3 className="text-gray-700 mb-2 text-lg font-medium lg:text-xl">
                  No {selectedStatus} recipients
                </h3>
                <p className="text-gray-500 max-w-xs text-sm lg:max-w-sm lg:text-base">
                  {searchQuery
                    ? 'No matching recipients with this status.'
                    : `No recipients have "${selectedStatus}" status.`}
                </p>
                <button
                  onClick={() => setSelectedStatus('all')}
                  className="mt-4 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 lg:px-5 lg:py-2.5 lg:text-base"
                >
                  View all recipients
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipientList;
