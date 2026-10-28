import { api } from '@/utils/axios';
import { ProfileData } from '@/types/profile';
import { base64ToFile } from './customerAboutApi';

/**
 * Exact payload shape that the backend `customers/payment` API accepts & returns:
 * {
 *   "upiId": "mutwalliumera@oksbi",
 *   "paymentPhoneNo": null,
 *   "bankName": "sdsdsad",
 *   "bankAccountNumber": null,
 *   "bankIfscCode": null,
 *   "bankHolderName": null,
 *   "accountType": "Savings Account"
 * }
 */
export interface CustomerPaymentPayload {
  upiId: string | null;
  paymentPhoneNo: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  bankHolderName: string | null;
  accountType: string | null;
  [key: string]: any;
}

export interface CustomerPaymentResponse {
  statusCode?: number;
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: any;
  payment?: any;
  errors?: any;
  [key: string]: any;
}

const v = (val: any): string | null => {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s.length > 0 ? s : null;
};

/**
 * Format frontend ProfileData into exact backend payment payload (customers/payment)
 */
export const formatCustomerPaymentPayload = (profile: Partial<ProfileData>): CustomerPaymentPayload => {
  const upiId = v(profile.upiId || profile.paymentQRs?.[0]?.upiId);
  const rawPhone = profile.paymentPhoneNo || profile.upiNumber || profile.paytmPhone || profile.phonePePhone || profile.gPayPhone || profile.paymentQRs?.[0]?.upiNumber || profile.primaryPhone;
  const cleanPhone = rawPhone ? String(rawPhone).replace(/[^\d+]/g, '') : '';
  const paymentPhoneNo = cleanPhone.length > 0 ? cleanPhone : null;

  const bankName = v(profile.bankName || profile.bankDetails?.bankName);

  const rawAcc = profile.bankAccountNumber || profile.accountNumber || profile.bankDetails?.accountNumber;
  const cleanAcc = rawAcc ? String(rawAcc).replace(/\s+/g, '') : '';
  const bankAccountNumber = cleanAcc.length > 0 ? cleanAcc : null;

  const rawIfsc = profile.bankIfscCode || profile.ifscCode || profile.bankDetails?.ifscCode;
  const cleanIfsc = rawIfsc ? String(rawIfsc).toUpperCase().replace(/\s+/g, '') : '';
  const bankIfscCode = cleanIfsc.length > 0 ? cleanIfsc : null;

  const bankHolderName = v(
    profile.bankHolderName ||
    profile.accountHolderName ||
    profile.bankDetails?.accountHolderName
  );
  const accountType = v(profile.accountType || profile.bankDetails?.accountType) || 'Savings Account';

  return {
    upiId,
    paymentPhoneNo,
    bankName,
    bankAccountNumber,
    bankIfscCode,
    bankHolderName,
    accountType,
    paytmPhone: v(profile.paytmPhone),
    phonePePhone: v(profile.phonePePhone),
    gPayPhone: v(profile.gPayPhone),
    paytmQrUrl: v(profile.paytmQrUrl),
    phonePeQrUrl: v(profile.phonePeQrUrl),
    gPayQrUrl: v(profile.gPayQrUrl),
    paytmQrProviderName: v(profile.paytmQrProviderName),
    phonePeQrProviderName: v(profile.phonePeQrProviderName),
    gPayQrProviderName: v(profile.gPayQrProviderName),
  };
};

/**
 * Parse backend payment response back into frontend ProfileData fields
 */
export const parseCustomerPaymentResponse = (res: any): Partial<ProfileData> => {
  let raw = res?.data || res?.payment || res;
  if (!raw || typeof raw !== 'object') return {};

  const upiId = raw.upiId || '';
  const phone = raw.paymentPhoneNo || raw.upiNumber || '';
  const bankName = raw.bankName || '';
  const holder = raw.bankHolderName || raw.accountHolderName || '';
  const accNo = raw.bankAccountNumber || raw.accountNumber || '';
  const ifsc = raw.bankIfscCode || raw.ifscCode || '';
  const accType = raw.accountType || 'Savings Account';

  // Wallets may come back as an array of { walletName, walletPhoneNo, walletQr }; map them onto
  // Paytm / PhonePe / Google Pay by name, falling back to their position (same order they are sent in)
  const walletList: any[] = Array.isArray(raw.wallets) ? raw.wallets : Array.isArray(raw.walletDetails) ? raw.walletDetails : [];
  const findWallet = (pattern: RegExp, idx: number) =>
    walletList.find((w) => pattern.test(String(w?.walletName || w?.name || ''))) || walletList[idx];
  const [paytmW, phonePeW, gPayW] = [
    findWallet(/paytm/i, 0),
    findWallet(/phone\s*pe/i, 1),
    findWallet(/google|gpay/i, 2),
  ];
  const wName = (w: any) => w?.walletName || w?.name || '';
  const wPhone = (w: any) => w?.walletPhoneNo || w?.phoneNo || w?.phone || '';
  const wQr = (w: any) => w?.walletQr || w?.qr || w?.qrUrl || '';

  if (walletList.length > 0) {
    raw = {
      ...raw,
      paytmQrProviderName: raw.paytmQrProviderName || wName(paytmW),
      paytmPhone: raw.paytmPhone || wPhone(paytmW),
      paytmQrUrl: raw.paytmQrUrl || wQr(paytmW),
      phonePeQrProviderName: raw.phonePeQrProviderName || wName(phonePeW),
      phonePePhone: raw.phonePePhone || wPhone(phonePeW),
      phonePeQrUrl: raw.phonePeQrUrl || wQr(phonePeW),
      gPayQrProviderName: raw.gPayQrProviderName || wName(gPayW),
      gPayPhone: raw.gPayPhone || wPhone(gPayW),
      gPayQrUrl: raw.gPayQrUrl || wQr(gPayW),
    };
  }

  return {
    upiId,
    upiNumber: phone,
    paymentPhoneNo: phone,
    paytmPhone: raw.paytmPhone || phone,
    phonePePhone: raw.phonePePhone || '',
    gPayPhone: raw.gPayPhone || '',
    paytmQrUrl: raw.paytmQrUrl || '',
    phonePeQrUrl: raw.phonePeQrUrl || '',
    gPayQrUrl: raw.gPayQrUrl || '',
    paytmQrProviderName: raw.paytmQrProviderName || 'Paytm',
    phonePeQrProviderName: raw.phonePeQrProviderName || 'PhonePe',
    gPayQrProviderName: raw.gPayQrProviderName || 'Google Pay',
    paytmQrUploaded: Boolean(raw.paytmQrUrl || raw.paytmQrUploaded),
    phonePeQrUploaded: Boolean(raw.phonePeQrUrl || raw.phonePeQrUploaded),
    gPayQrUploaded: Boolean(raw.gPayQrUrl || raw.gPayQrUploaded),
    bankName,
    accountHolderName: holder,
    bankHolderName: holder,
    accountNumber: accNo,
    bankAccountNumber: accNo,
    ifscCode: ifsc,
    bankIfscCode: ifsc,
    accountType: accType,
  };
};

/**
 * GET customers/payment OR superAdmin/admin/:adminId/payment
 */
export const getCustomerPayment = async (adminId?: string): Promise<CustomerPaymentResponse> => {
  const endpoint = adminId ? `superAdmin/admin/${adminId}/payment` : 'customers/payment';
  try {
    const response = await api.get(endpoint);
    return (response as any)?.data || response;
  } catch (error: any) {
    if (!adminId && (error?.response?.status === 404 || error?.response?.status === 405)) {
      try {
        const pluralRes = await api.get('customers/payments');
        return (pluralRes as any)?.data || pluralRes;
      } catch (pluralErr: any) {
        if (pluralErr?.response?.status === 404 || pluralErr?.response?.status === 405) {
          const fallback = await api.get('customers/info');
          return (fallback as any)?.data || fallback;
        }
        throw pluralErr;
      }
    }
    throw error;
  }
};

// Wallet-specific keys; these go out as repeated walletName / walletPhoneNo / walletQr entries instead
const WALLET_KEYS = [
  'paytmPhone', 'phonePePhone', 'gPayPhone',
  'paytmQrUrl', 'phonePeQrUrl', 'gPayQrUrl',
  'paytmQrProviderName', 'phonePeQrProviderName', 'gPayQrProviderName',
];

/**
 * Build the multipart body for the payment API.
 * Bank / UPI fields are plain text; each wallet (Paytm, PhonePe, Google Pay) that has a phone or QR repeats
 * walletName, walletPhoneNo and walletQr in that order. walletQr is a File for a newly uploaded QR,
 * the existing URL to keep the old QR, or empty for no QR.
 */
export const formatCustomerPaymentFormData = (profile: Partial<ProfileData>): FormData => {
  const payload = formatCustomerPaymentPayload(profile);
  const formData = new FormData();

  Object.entries(payload).forEach(([key, val]) => {
    if (WALLET_KEYS.includes(key) || val === null || val === undefined || val === '') return;
    formData.append(key, String(val));
  });

  const wallets = [
    { name: payload.paytmQrProviderName || 'Paytm', phone: payload.paytmPhone, qr: payload.paytmQrUrl, file: 'paytm-qr' },
    { name: payload.phonePeQrProviderName || 'PhonePe', phone: payload.phonePePhone, qr: payload.phonePeQrUrl, file: 'phonepe-qr' },
    { name: payload.gPayQrProviderName || 'Google Pay', phone: payload.gPayPhone, qr: payload.gPayQrUrl, file: 'gpay-qr' },
  ];

  wallets
    .filter((w) => w.phone || w.qr)
    .forEach((w) => {
      formData.append('walletName', w.name);
      formData.append('walletPhoneNo', w.phone || '');
      const qr: string = w.qr || '';
      const qrFile = qr.startsWith('data:') ? base64ToFile(qr, w.file) : null;
      if (qrFile) {
        formData.append('walletQr', qrFile);
      } else if (qr.startsWith('blob:')) {
        formData.append('walletQr', ''); // local preview only, nothing to upload
      } else {
        formData.append('walletQr', qr);
      }
    });

  return formData;
};

/**
 * Save or update payment methods & dynamic QR (POST/PATCH customers/payment OR superAdmin/admin/:adminId/payment)
 * Sent as multipart/form-data (see formatCustomerPaymentFormData).
 */
export const saveOrUpdateCustomerPayment = async (
  profile: Partial<ProfileData>,
  adminId?: string
): Promise<CustomerPaymentResponse> => {
  const payload = formatCustomerPaymentFormData(profile);
  const endpoint = adminId ? `superAdmin/admin/${adminId}/payment` : 'customers/payment';

  // 1. Try POST
  try {
    const res = await api.post(endpoint, payload);
    return (res as any)?.data || res;
  } catch (err: any) {
    // 2. Try PATCH
    if (err?.response?.status === 405 || err?.response?.status === 404 || err?.response?.status === 409) {
      try {
        const patchRes = await api.patch(endpoint, payload);
        return (patchRes as any)?.data || patchRes;
      } catch (patchErr: any) {
        if (!adminId && (patchErr?.response?.status === 404 || patchErr?.response?.status === 405)) {
          try {
            const paymentsRes = await api.post('customers/payments', payload);
            return (paymentsRes as any)?.data || paymentsRes;
          } catch (paymentsPostErr: any) {
            try {
              const paymentsPatch = await api.patch('customers/payments', payload);
              return (paymentsPatch as any)?.data || paymentsPatch;
            } catch (paymentsPatchErr: any) {
              const infoRes = await api.patch('customers/info', payload);
              return (infoRes as any)?.data || infoRes;
            }
          }
        }
        throw patchErr;
      }
    }
    throw err;
  }
};

export const createCustomerPayment = async (payload: CustomerPaymentPayload): Promise<CustomerPaymentResponse> => {
  return saveOrUpdateCustomerPayment(payload);
};

export const updateCustomerPayment = async (payload: Partial<CustomerPaymentPayload>): Promise<CustomerPaymentResponse> => {
  return saveOrUpdateCustomerPayment(payload);
};
