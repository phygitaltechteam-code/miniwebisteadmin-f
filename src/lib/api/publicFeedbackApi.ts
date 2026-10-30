import { unAuthenticatedApi } from '@/utils/axios';

/** One customer review shown on the public card */
export interface PublicFeedback {
  id: string;
  rating: number;
  fullName: string;
  message: string;
  createdAt?: string;
}

/** POST client/admins/feedback/:target (admin id or vanity URL); no login */
export const submitPublicFeedback = async (
  target: string,
  body: { rating: number; fullName: string; message: string },
): Promise<PublicFeedback> => {
  const res: any = await unAuthenticatedApi.post(`client/admins/feedback/${encodeURIComponent(target)}`, body);
  const data = res?.data ?? res;
  return {
    id: String(data?.id || `fb_${Date.now()}`),
    rating: Number(data?.rating) || body.rating,
    fullName: body.fullName,
    message: body.message,
    createdAt: data?.createdAt || new Date().toISOString(),
  };
};

/** POST client/admins/enquiry/:target (admin id or vanity URL); no login. Saved as an enquiry for the business */
export const submitPublicEnquiry = async (
  target: string,
  body: { fullName: string; phone: string; email?: string; message: string },
): Promise<void> => {
  const clean: Record<string, string> = { fullName: body.fullName.trim(), phone: body.phone.trim(), message: body.message.trim() };
  if (body.email?.trim()) clean.email = body.email.trim();
  await unAuthenticatedApi.post(`client/admins/enquiry/${encodeURIComponent(target)}`, clean);
};

/** Saved reviews when the public card response includes them (feedbacks / feedback.items) */
export const feedbacksFromCard = (card: any): PublicFeedback[] => {
  const raw = card?.feedbacks || card?.feedback?.items || card?.feedback?.feedbacks || [];
  return (Array.isArray(raw) ? raw : []).map((f: any, i: number) => ({
    id: String(f?.id || `fb_${i}`),
    rating: Number(f?.rating ?? f?.stars) || 0,
    fullName: String(f?.fullName || f?.name || 'Customer'),
    message: String(f?.message || f?.feedback || ''),
    createdAt: f?.createdAt,
  }));
};

export const feedbackErrorText = (error: any) => {
  const status = error?.response?.status;
  if (status === 429) return 'Too many requests. Please try again later.';
  return error?.response?.data?.message || (status === 404 ? 'This card is not available.' : 'Could not send. Please try again.');
};
