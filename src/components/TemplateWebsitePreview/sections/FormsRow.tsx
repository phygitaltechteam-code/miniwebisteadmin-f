import React from 'react';
import { Star } from 'lucide-react';
import { PublicFeedback } from '@/lib/api/publicFeedbackApi';
import { SectionProps } from '../useTemplateModel';
import { SectionTitle } from '../SectionTitle';
import { titleParts, INPUT_CLASS } from '../helpers';
import { ShareInRow } from './ShareCard';

/** One saved review (desktop grid clamps the message to 3 lines) */
const ReviewCard: React.FC<{ r: PublicFeedback; clamp?: boolean }> = ({ r, clamp }) => (
  <div className={`rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm tpl-fade-in${clamp ? ' min-w-0' : ''}`}>
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 min-w-0">
        <span className="w-8 h-8 shrink-0 rounded-full bg-[var(--cs)] text-[var(--c)] flex items-center justify-center text-[13px] font-bold">
          {(r.fullName || 'C').charAt(0).toUpperCase()}
        </span>
        <span className="text-[13px] font-semibold text-[#0B1B33] truncate">{r.fullName}</span>
      </span>
      <span className="flex shrink-0">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={`w-3.5 h-3.5 text-amber-400 ${n <= r.rating ? 'fill-amber-400' : ''}`} />
        ))}
      </span>
    </div>
    {r.message && <p className={`mt-2 text-[12.5px] text-slate-600 leading-relaxed break-words${clamp ? ' line-clamp-3' : ''}`}>{r.message}</p>}
    {r.createdAt && (
      <p className="mt-1 text-[10.5px] text-slate-400">
        {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </p>
    )}
  </div>
);

const EnquiryForm: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, headings, enquiry, setEnquiry, enquiryState, sendEnquiry } = t;
  return (
    <section data-section="enquiry" className="order-2 flex flex-col">
      <SectionTitle isMobile={isMobile} {...titleParts(headings.enquirySectionHeading, 'Send Enquiry')} />
      <form onSubmit={sendEnquiry} className="flex-1 flex flex-col rounded-2xl border border-slate-200 border-t-4 border-t-[var(--c)] bg-white p-5 shadow-sm space-y-3">
        <input required value={enquiry.name} onChange={(e) => setEnquiry({ ...enquiry, name: e.target.value })} placeholder="Enter Full Name" className={INPUT_CLASS} />
        <input required type="tel" value={enquiry.phone} onChange={(e) => setEnquiry({ ...enquiry, phone: e.target.value })} placeholder="Enter Mobile Number" className={INPUT_CLASS} />
        <input type="email" value={enquiry.email} onChange={(e) => setEnquiry({ ...enquiry, email: e.target.value })} placeholder="Enter Email" className={INPUT_CLASS} />
        <textarea required value={enquiry.message} onChange={(e) => setEnquiry({ ...enquiry, message: e.target.value })} placeholder="Enter your comment" rows={3} className={`${INPUT_CLASS} flex-1 resize-none`} />
        {enquiryState.error && <p className="text-[12px] text-red-600">{enquiryState.error}</p>}
        {enquiryState.sent && <p className="text-[12.5px] font-semibold text-emerald-600 tpl-fade-in">Thank you! Your enquiry has been sent.</p>}
        <button type="submit" disabled={enquiryState.busy} className="w-full rounded-lg bg-[var(--c)] hover:bg-[var(--cd)] px-5 py-3 shadow-sm transition-colors text-[13px] font-semibold text-white disabled:opacity-60">
          {enquiryState.busy ? 'Sending…' : 'Send Enquiry'}
        </button>
      </form>
    </section>
  );
};

const FeedbackForm: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, headings, reviews, feedback, setFeedback, feedbackBusy, feedbackError, sendFeedback } = t;
  return (
    <section data-section={!isMobile && reviews.length > 0 ? undefined : 'feedback'} className="order-1 flex flex-col">
      {!isMobile && reviews.length > 0 ? (
        <SectionTitle isMobile={isMobile} first="Write a" second="Review" />
      ) : (
        <SectionTitle isMobile={isMobile} {...titleParts(headings.feedbackHeading, 'Customer Reviews')} />
      )}

      {/* Mobile: saved reviews first (newest on top), then the form */}
      {isMobile && reviews.length > 0 && (
        <div className="mb-4 space-y-2.5">
          {reviews.map((r) => <ReviewCard key={r.id} r={r} />)}
        </div>
      )}

      <div className="flex-1 flex flex-col rounded-2xl border border-slate-200 border-t-4 border-t-[var(--c)] bg-white p-5 shadow-sm">
        <form onSubmit={sendFeedback} className="flex-1 flex flex-col space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex" onMouseLeave={() => setFeedback({ ...feedback, hover: 0 })}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFeedback({ ...feedback, rating: n })}
                  onMouseEnter={() => setFeedback({ ...feedback, hover: n })}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Star className={`w-6 h-6 text-amber-400 ${n <= (feedback.hover || feedback.rating) ? 'fill-amber-400' : ''}`} />
                </button>
              ))}
            </div>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10.5px] font-semibold text-white">
              {feedback.rating ? `${feedback.rating} / 5` : 'Select a Rating'}
            </span>
          </div>
          <input required value={feedback.name} onChange={(e) => setFeedback({ ...feedback, name: e.target.value })} placeholder="Enter Full Name" className={INPUT_CLASS} />
          <textarea required value={feedback.message} onChange={(e) => setFeedback({ ...feedback, message: e.target.value })} placeholder="Write your review" rows={3} className={`${INPUT_CLASS} flex-1 resize-none`} />
          {feedbackError && <p className="text-[12px] text-red-600">{feedbackError}</p>}
          {feedback.sent && <p className="text-[12.5px] font-semibold text-emerald-600 tpl-fade-in">Thank you for your review!</p>}
          <button
            type="submit"
            disabled={!feedback.rating || feedbackBusy}
            className="w-full rounded-lg bg-[var(--c)] hover:bg-[var(--cd)] px-5 py-3 shadow-sm transition-colors text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {feedbackBusy ? 'Sending…' : 'Submit Review'}
          </button>
        </form>
      </div>
    </section>
  );
};

/** Review + Enquiry forms (review first via grid order); on desktop the Share card joins the row */
export const FormsRow: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, isTablet, show, shareInRow, reviews, headings } = t;
  return (
    <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : shareInRow ? 'grid-cols-3' : 'grid-cols-2'}`} style={{ order: 100 }}>
      {/* Desktop: saved reviews in a row above both forms, so the two columns stay even */}
      {!isMobile && show.feedback && reviews.length > 0 && (
        <section data-section="feedback" className="order-0 col-span-full">
          <SectionTitle isMobile={isMobile} {...titleParts(headings.feedbackHeading, 'Customer Reviews')} />
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${isTablet ? 2 : 3}, minmax(0, 1fr))` }}>
            {reviews.map((r) => <ReviewCard key={r.id} r={r} clamp />)}
          </div>
        </section>
      )}
      {shareInRow && <ShareInRow t={t} />}
      {show.enquiry && <EnquiryForm t={t} />}
      {show.feedback && <FeedbackForm t={t} />}
    </div>
  );
};
