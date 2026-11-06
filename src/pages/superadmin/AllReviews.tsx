import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Phone,
  RefreshCw,
  Search,
  Star,
  X,
  Check,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAdminFeedbackOverview,
  useAdminSpecificFeedbacks,
} from '@/lib/react-query/reviews';
import {
  AdminFeedbackOverviewItem,
  reviewsErrorText,
  updateAdminFeedbacksBulk,
} from '@/lib/api/reviewsApi';
import { rebaseCardUrl } from '@/utils/cardUrl';

const fmtDateTime = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const Stars: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'w-3.5 h-3.5' }) => {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= rounded ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </span>
  );
};

export interface AllReviewsProps {
  onOpenBusiness?: (adminId: string, businessName?: string) => void;
  onBack?: () => void;
}

export const AllReviews: React.FC<AllReviewsProps> = ({ onBack }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Selected row for the "Feedback Details — Business" popup
  const [selectedAdmin, setSelectedAdmin] = useState<AdminFeedbackOverviewItem | null>(null);

  // Editable fields inside the popup:
  // message: 2-2000 chars, fullName: string, rating: 1-5
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({});
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});
  const [editedRatings, setEditedRatings] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Main table data: admin-wise feedback summary
  const {
    data: overviewData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminFeedbackOverview({
    search: debouncedSearch,
    page,
    limit,
  });

  // Feedbacks query for the selected admin inside the popup
  const {
    data: adminFeedbacksData,
    isLoading: isFeedbacksLoading,
    refetch: refetchAdminFeedbacks,
  } = useAdminSpecificFeedbacks(
    selectedAdmin?.adminId || '',
    { page: 1, limit: 50 },
    { enabled: Boolean(selectedAdmin?.adminId) },
  );

  // Synchronize editable fields when feedbacks load for selected admin
  useEffect(() => {
    if (adminFeedbacksData?.feedbacks) {
      const initialMsgs: Record<string, string> = {};
      const initialNames: Record<string, string> = {};
      const initialRatings: Record<string, number> = {};

      adminFeedbacksData.feedbacks.forEach((f) => {
        initialMsgs[f.id] = f.message || '';
        initialNames[f.id] = f.fullName || '';
        initialRatings[f.id] = f.rating || 5;
      });

      setEditedMessages(initialMsgs);
      setEditedNames(initialNames);
      setEditedRatings(initialRatings);
    }
  }, [adminFeedbacksData?.feedbacks]);

  // Calculate modified rows that differ from original backend values
  const changedFeedbacks = useMemo(() => {
    if (!adminFeedbacksData?.feedbacks) return [];
    const list = adminFeedbacksData.feedbacks;
    const changed: { id: string; message?: string; fullName?: string; rating?: number }[] = [];

    list.forEach((fb) => {
      const isMsgChanged =
        editedMessages[fb.id] !== undefined && editedMessages[fb.id] !== (fb.message || '');
      const isNameChanged =
        editedNames[fb.id] !== undefined && editedNames[fb.id] !== (fb.fullName || '');
      const isRatingChanged =
        editedRatings[fb.id] !== undefined && editedRatings[fb.id] !== (fb.rating || 0);

      if (isMsgChanged || isNameChanged || isRatingChanged) {
        const item: { id: string; message?: string; fullName?: string; rating?: number } = {
          id: fb.id,
        };
        if (isMsgChanged) item.message = editedMessages[fb.id].trim();
        if (isNameChanged) item.fullName = editedNames[fb.id].trim();
        if (isRatingChanged) item.rating = editedRatings[fb.id];
        changed.push(item);
      }
    });

    return changed;
  }, [adminFeedbacksData?.feedbacks, editedMessages, editedNames, editedRatings]);

  const handleRowClick = (admin: AdminFeedbackOverviewItem) => {
    setSelectedAdmin(admin);
  };

  const handleClosePopup = () => {
    setSelectedAdmin(null);
    setEditedMessages({});
    setEditedNames({});
    setEditedRatings({});
  };

  const handleMessageChange = (feedbackId: string, value: string) => {
    setEditedMessages((prev) => ({ ...prev, [feedbackId]: value }));
  };

  const handleNameChange = (feedbackId: string, value: string) => {
    setEditedNames((prev) => ({ ...prev, [feedbackId]: value }));
  };

  const handleRatingChange = (feedbackId: string, rating: number) => {
    setEditedRatings((prev) => ({ ...prev, [feedbackId]: rating }));
  };

  // Bulk Save all modified rows in one call: PATCH /api/v1/superAdmin/admin/:adminId/feedbacks
  const handleSaveMessages = async () => {
    if (!selectedAdmin) return;

    if (changedFeedbacks.length === 0) {
      toast('No changes were made to save.');
      return;
    }

    // Validation per backend rules:
    // Message: 2-2000 characters
    // Name: not empty
    for (const item of changedFeedbacks) {
      if (item.message !== undefined) {
        if (item.message.length < 2) {
          toast.error('Feedback message must be at least 2 characters long.');
          return;
        }
        if (item.message.length > 2000) {
          toast.error('Feedback message must not exceed 2000 characters.');
          return;
        }
      }
      if (item.fullName !== undefined && item.fullName.length === 0) {
        toast.error('Customer name cannot be empty.');
        return;
      }
    }

    setIsSaving(true);
    try {
      await updateAdminFeedbacksBulk(selectedAdmin.adminId, changedFeedbacks);
      toast.success('Feedbacks saved successfully!');
      refetchAdminFeedbacks();
      refetch();
      handleClosePopup();
    } catch (err: any) {
      console.error('Save feedback error:', err);
      const apiMsg = err?.response?.data?.message || err?.message || 'Failed to save feedback.';
      toast.error(apiMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const adminsList = overviewData?.admins || [];
  const pagination = overviewData?.pagination;
  const totalItems = pagination?.total || adminsList.length;
  const totalPages = pagination?.totalPages || Math.ceil(totalItems / limit) || 1;
  const startIdx = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, totalItems);

  return (
    <div className="space-y-4 font-['Roboto',Helvetica,Arial,sans-serif]">
      {/* Top Bar: ONLY Back Button and clean Title / Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E0E0E0]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack ? onBack : () => window.history.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#C4C4C4] text-gray-700 hover:bg-gray-100 text-[13px] font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-[18px] font-bold text-[#212121]">Reviews</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search business, owner, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-[13px] rounded border border-[#C4C4C4] bg-white outline-none focus:border-[#2196F3] text-gray-800 placeholder:text-gray-400 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => refetch()}
            className="h-8 w-8 flex items-center justify-center rounded border border-[#C4C4C4] text-gray-600 hover:text-[#2196F3] hover:bg-gray-50 transition"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#2196F3]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table: exactly 4 columns: Admin Details, Feedback, Average Rating, Latest Feedback */}
      <div className="bg-white border border-[#E0E0E0] rounded shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-gray-500 text-[13px]">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-[#2196F3]" />
            Loading reviews…
          </div>
        ) : isError ? (
          <div className="py-14 px-4 text-center text-rose-600 text-[13px]">
            {reviewsErrorText(error)}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => refetch()}
                className="px-3 py-1 text-xs rounded border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : adminsList.length === 0 ? (
          <div className="py-20 text-center text-gray-500 text-[13px]">
            <p className="font-medium text-gray-700 text-[14px]">No reviews found</p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? 'Try adjusting your search query.' : 'No businesses have received feedback yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="bg-[#2196F3] text-white text-[14px] font-medium select-none">
                  <th className="w-16 px-4 py-3 text-center text-white">Sr. No.</th>
                  <th className="px-4 py-3 text-white">Admin Details</th>
                  <th className="px-4 py-3 text-white">Feedback</th>
                  <th className="px-4 py-3 text-white">Average Rating</th>
                  <th className="px-4 py-3 text-white">Latest Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0] text-[14px]">
                {adminsList.map((admin, idx) => {
                  const cardUrl = admin.cardLink ? rebaseCardUrl(admin.cardLink) : '';
                  return (
                    <tr
                      key={admin.adminId || idx}
                      onClick={() => handleRowClick(admin)}
                      className="hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                      title="Click to view feedback details"
                    >
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">
                        {(page - 1) * limit + idx + 1}
                      </td>

                      {/* 1. Admin Details */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#1976D2] hover:underline">
                            {admin.businessName || 'Business'}
                          </span>
                          {cardUrl && (
                            <a
                              href={cardUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Open digital card"
                              className="text-gray-400 hover:text-[#2196F3] p-0.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          <span>{admin.ownerName || '-'}</span>
                          {admin.phoneNumber && (
                            <span className="text-gray-500 font-mono"> · {admin.phoneNumber}</span>
                          )}
                        </div>
                      </td>

                      {/* 2. Feedback */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1976D2]">
                          {admin.totalRatings} {admin.totalRatings === 1 ? 'Review' : 'Reviews'}
                        </span>
                      </td>

                      {/* 3. Average Rating */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Stars rating={admin.averageRating} />
                          <span className="font-bold text-[#212121]">
                            {admin.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </td>

                      {/* 4. Latest Feedback */}
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        {fmtDateTime(admin.lastFeedbackAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-t border-[#E0E0E0] text-[13px] text-gray-600">
            <span>
              Showing <b className="text-gray-900">{startIdx}</b> to <b className="text-gray-900">{endIdx}</b> of{' '}
              <b className="text-gray-900">{totalItems}</b> entries
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded border border-[#C4C4C4] text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500 font-medium">
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded border border-[#C4C4C4] text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL: "Feedback Details — Business" with Bulk Save & Editable Fields*/}
      {/* ========================================================================= */}
      {selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header: Feedback Details — Business */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0] bg-gray-50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#2196F3]" />
                <h3 className="text-[17px] font-bold text-[#212121]">
                  Feedback Details — {selectedAdmin.businessName}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClosePopup}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Dialog Header Summary: Admin details, Total Feedback, Average Rating, Latest Feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-gray-50 border border-[#E0E0E0]">
                {/* 1. Admin Details */}
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Admin Details
                  </p>
                  <p className="text-[14px] font-bold text-[#212121] mt-1">
                    {selectedAdmin.businessName}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {selectedAdmin.ownerName || '-'}
                  </p>
                  {selectedAdmin.phoneNumber && (
                    <p className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#2196F3]" />
                      {selectedAdmin.phoneNumber}
                    </p>
                  )}
                  {selectedAdmin.cardLink && (
                    <a
                      href={rebaseCardUrl(selectedAdmin.cardLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#2196F3] hover:underline mt-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" /> View Live Card
                    </a>
                  )}
                </div>

                {/* 2. Feedback Count */}
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Total Feedback
                  </p>
                  <p className="text-2xl font-bold text-[#212121] mt-1">
                    {adminFeedbacksData?.summary?.totalRatings ?? selectedAdmin.totalRatings}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Reviews submitted</p>
                </div>

                {/* 3. Average Rating */}
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Average Rating
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#212121]">
                      {(adminFeedbacksData?.summary?.averageRating ?? selectedAdmin.averageRating).toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">/ 5.0</span>
                  </div>
                  <div className="mt-1">
                    <Stars
                      rating={adminFeedbacksData?.summary?.averageRating ?? selectedAdmin.averageRating}
                      size="w-3.5 h-3.5"
                    />
                  </div>
                </div>

                {/* 4. Latest Feedback */}
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Latest Feedback
                  </p>
                  <p className="text-[13px] font-medium text-[#212121] mt-1">
                    {fmtDateTime(
                      adminFeedbacksData?.summary?.latestFeedbackAt || selectedAdmin.lastFeedbackAt,
                    )}
                  </p>
                  {selectedAdmin.franchise?.businessName && (
                    <p className="text-xs text-gray-500 mt-1">
                      Franchise: <span className="font-medium text-gray-700">{selectedAdmin.franchise.businessName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Customer Feedbacks Table with Editable Message, Name and Rating */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[15px] font-bold text-[#212121]">
                    Customer Feedback & Messages
                  </h4>
                  <span className="text-xs text-gray-500">
                    Edit message (2–2000 chars), name, or rating, then click Save below
                  </span>
                </div>

                {isFeedbacksLoading ? (
                  <div className="py-12 text-center text-gray-500 text-[13px] border border-[#E0E0E0] rounded">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-[#2196F3]" />
                    Loading feedback submissions…
                  </div>
                ) : (adminFeedbacksData?.feedbacks || []).length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-[13px] border border-[#E0E0E0] rounded">
                    <p className="font-medium text-gray-700">No feedback messages found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      No feedback submissions recorded for this business.
                    </p>
                  </div>
                ) : (
                  <div className="border border-[#E0E0E0] rounded overflow-hidden">
                    <table className="w-full table-auto text-left">
                      <thead>
                        <tr className="bg-gray-100 text-[#424242] text-[13px] font-semibold">
                          <th className="w-16 px-3 py-2.5 text-center">Sr. No.</th>
                          <th className="w-48 px-3 py-2.5">Customer Name</th>
                          <th className="w-36 px-3 py-2.5">Rating (1–5)</th>
                          <th className="px-3 py-2.5">Customer Message (Editable)</th>
                          <th className="w-36 px-3 py-2.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E0E0E0] text-[13px]">
                        {(adminFeedbacksData?.feedbacks || []).map((fb, fIdx) => {
                          const currentRating = editedRatings[fb.id] ?? fb.rating ?? 5;
                          const currentMessage = editedMessages[fb.id] ?? fb.message ?? '';
                          const isEdited =
                            (editedMessages[fb.id] !== undefined && editedMessages[fb.id] !== (fb.message || '')) ||
                            (editedNames[fb.id] !== undefined && editedNames[fb.id] !== (fb.fullName || '')) ||
                            (editedRatings[fb.id] !== undefined && editedRatings[fb.id] !== (fb.rating || 0));

                          return (
                            <tr
                              key={fb.id || fIdx}
                              className={`transition-colors ${isEdited ? 'bg-amber-50/50' : 'hover:bg-gray-50'}`}
                            >
                              <td className="px-3 py-3 text-center text-gray-500 text-xs align-top">
                                <div className="pt-1.5">{fIdx + 1}</div>
                                {isEdited && (
                                  <span className="inline-block mt-1 w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified" />
                                )}
                              </td>

                              {/* Editable Customer Name */}
                              <td className="px-3 py-3 align-top">
                                <input
                                  type="text"
                                  value={editedNames[fb.id] ?? fb.fullName ?? ''}
                                  onChange={(e) => handleNameChange(fb.id, e.target.value)}
                                  placeholder="Customer Name"
                                  className="w-full rounded border border-[#C4C4C4] bg-white px-2.5 py-1 text-[13px] text-gray-800 focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none transition"
                                />
                                {fb.phone && (
                                  <p className="text-[11px] text-gray-500 font-mono mt-1">
                                    Tel: {fb.phone}
                                  </p>
                                )}
                              </td>

                              {/* Editable Rating (Interactive Stars) */}
                              <td className="px-3 py-3 align-top whitespace-nowrap">
                                <div className="flex items-center gap-0.5 pt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => handleRatingChange(fb.id, star)}
                                      className="p-0.5 hover:scale-125 transition-transform"
                                      title={`Set to ${star} star${star === 1 ? '' : 's'}`}
                                    >
                                      <Star
                                        className={`w-4 h-4 ${
                                          star <= currentRating
                                            ? 'text-amber-400 fill-amber-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                  <span className="font-bold text-xs text-[#212121] ml-1">
                                    {currentRating}
                                  </span>
                                </div>
                              </td>

                              {/* Editable Customer Message Column (2-2000 chars) */}
                              <td className="px-3 py-3 align-top">
                                <textarea
                                  rows={2}
                                  value={currentMessage}
                                  onChange={(e) => handleMessageChange(fb.id, e.target.value)}
                                  placeholder="Enter customer review message (2–2000 chars)…"
                                  className="w-full rounded border border-[#C4C4C4] bg-white px-3 py-1.5 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3] outline-none transition resize-y font-['Roboto',Helvetica,Arial,sans-serif]"
                                />
                                <div className="flex items-center justify-between mt-0.5 text-[11px] text-gray-400">
                                  <span>{currentMessage.trim().length < 2 ? 'Min 2 characters' : ''}</span>
                                  <span>{currentMessage.length}/2000</span>
                                </div>
                              </td>

                              {/* Date */}
                              <td className="px-3 py-3 align-top text-xs text-gray-500 whitespace-nowrap">
                                <div className="pt-1.5">{fmtDateTime(fb.createdAt)}</div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer: Cancel and Save button */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-gray-50 border-t border-[#E0E0E0]">
              <div className="text-xs text-gray-500">
                {changedFeedbacks.length > 0 ? (
                  <span className="text-[#1976D2] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    {changedFeedbacks.length} {changedFeedbacks.length === 1 ? 'feedback' : 'feedbacks'} modified — ready to save
                  </span>
                ) : (
                  <span>Click customer message, name, or stars to edit.</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClosePopup}
                  disabled={isSaving}
                  className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-white hover:bg-gray-100 rounded border border-[#C4C4C4] transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMessages}
                  disabled={isSaving || changedFeedbacks.length === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-[13px] font-medium text-white bg-[#2196F3] hover:bg-[#1E88E5] rounded shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllReviews;
