import { api } from '@/utils/axios';
import { ProfileData } from '@/types/profile';

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
  const rawPhone = profile.paymentPhoneNo || profile.upiNumber || profile.paymentQRs?.[0]?.upiNumber || profile.primaryPhone;
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
  };
};

/**
 * Parse backend payment response back into frontend ProfileData fields
 */
export const parseCustomerPaymentResponse = (res: any): Partial<ProfileData> => {
  const raw = res?.data || res?.payment || res;
  if (!raw || typeof raw !== 'object') return {};

  const upiId = raw.upiId || '';
  const phone = raw.paymentPhoneNo || raw.upiNumber || '';
  const bankName = raw.bankName || '';
  const holder = raw.bankHolderName || raw.accountHolderName || '';
  const accNo = raw.bankAccountNumber || raw.accountNumber || '';
  const ifsc = raw.bankIfscCode || raw.ifscCode || '';
  const accType = raw.accountType || 'Savings Account';

  return {
    upiId,
    upiNumber: phone,
    paymentPhoneNo: phone,
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
 * GET customers/payment (with fallback to customers/payments and customers/info)
 */
export const getCustomerPayment = async (): Promise<CustomerPaymentResponse> => {
  try {
    const response = await api.get('customers/payment');
    return (response as any)?.data || response;
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
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

/**
 * Save or update payment methods & dynamic QR (POST/PATCH customers/payment)
 */
export const saveOrUpdateCustomerPayment = async (
  profile: Partial<ProfileData>
): Promise<CustomerPaymentResponse> => {
  const payload = formatCustomerPaymentPayload(profile);

  // 1. Try POST customers/payment
  try {
    const res = await api.post('customers/payment', payload);
    return (res as any)?.data || res;
  } catch (err: any) {
    // 2. Try PATCH customers/payment
    if (err?.response?.status === 405 || err?.response?.status === 404) {
      try {
        const patchRes = await api.patch('customers/payment', payload);
        return (patchRes as any)?.data || patchRes;
      } catch (patchErr: any) {
        // 3. Try customers/payments
        if (patchErr?.response?.status === 404 || patchErr?.response?.status === 405) {
          try {
            const paymentsRes = await api.post('customers/payments', payload);
            return (paymentsRes as any)?.data || paymentsRes;
          } catch (paymentsPostErr: any) {
            try {
              const paymentsPatch = await api.patch('customers/payments', payload);
              return (paymentsPatch as any)?.data || paymentsPatch;
            } catch (paymentsPatchErr: any) {
              // 4. Fallback to customers/info
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
