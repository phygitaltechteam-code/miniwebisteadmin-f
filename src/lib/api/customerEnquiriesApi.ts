import { api } from '@/utils/axios';
import { CustomerEnquiry } from '@/types/profile';

export interface CustomerEnquiriesResponse {
  success?: boolean;
  message?: string;
  data?: any;
  enquires?: any[];
  enquiries?: any[];
  total?: number;
  [key: string]: any;
}

/**
 * Normalizes any backend enquiry record into frontend CustomerEnquiry format
 */
export const normalizeEnquiryItem = (item: any, index: number = 0): CustomerEnquiry => {
  const id = String(item?.id || item?._id || item?.enquiryId || `enq-${index + 1}`);
  const customerName =
    item?.customerName ||
    item?.name ||
    item?.fullName ||
    item?.userName ||
    item?.clientName ||
    'Customer';
  const phoneNumber =
    item?.phoneNumber ||
    item?.phone ||
    item?.mobile ||
    item?.contact ||
    item?.contactNumber ||
    '';
  const email = item?.email || item?.mail || item?.customerEmail || '';
  const serviceRequested =
    item?.serviceRequested ||
    item?.service ||
    item?.product ||
    item?.productName ||
    item?.subject ||
    item?.title ||
    item?.enquiryType ||
    '';
  const message =
    item?.message ||
    item?.enquiry ||
    item?.enquiryMessage ||
    item?.notes ||
    item?.description ||
    '';

  let formattedDate = 'Recently';
  const rawDate = item?.createdAt || item?.created_at || item?.date || item?.timestamp;
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } else {
        formattedDate = String(rawDate);
      }
    } catch {
      formattedDate = String(rawDate);
    }
  }

  let status: CustomerEnquiry['status'] = 'New';
  const s = String(item?.status || '').toLowerCase();
  if (s.includes('progress') || s.includes('working') || s.includes('pending')) {
    status = 'In Progress';
  } else if (
    s.includes('complete') ||
    s.includes('resolved') ||
    s.includes('done') ||
    s.includes('closed')
  ) {
    status = 'Completed';
  } else {
    status = 'New';
  }

  return {
    id,
    customerName,
    phoneNumber,
    email,
    serviceRequested,
    message,
    createdAt: formattedDate,
    status,
  };
};

/**
 * Extracts and maps enquiries from varied API response shapes
 */
export const extractEnquiriesList = (response: any): CustomerEnquiry[] => {
  if (!response) return [];
  const raw = response?.data !== undefined ? response.data : response;

  let list: any[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.enquires)) {
      list = raw.enquires;
    } else if (Array.isArray(raw.enquiries)) {
      list = raw.enquiries;
    } else if (Array.isArray(raw.data)) {
      list = raw.data;
    } else if (Array.isArray(raw.leads)) {
      list = raw.leads;
    } else if (Array.isArray(raw.items)) {
      list = raw.items;
    } else if (Array.isArray(raw.results)) {
      list = raw.results;
    }
  }

  return list.map((item, idx) => normalizeEnquiryItem(item, idx));
};

/**
 * GET customers/enquires
 * Fetches customer leads & enquiries captured from digital business cards
 */
export const getCustomerEnquiries = async (): Promise<CustomerEnquiry[]> => {
  try {
    const response = await api.get('customers/enquires');
    return extractEnquiriesList(response?.data || response);
  } catch (error: any) {
    // Graceful fallback to customers/enquiries if backend uses alternate spelling
    if (error?.response?.status === 404) {
      try {
        const fallbackRes = await api.get('customers/enquiries');
        return extractEnquiriesList(fallbackRes?.data || fallbackRes);
      } catch (fallbackError) {
        console.error('Error fetching customers/enquiries fallback:', fallbackError);
        throw fallbackError;
      }
    }
    console.error('Error fetching customers/enquires:', error);
    throw error;
  }
};

/**
 * PATCH customers/enquires/:id
 * Updates status of an enquiry (e.g. 'New' | 'In Progress' | 'Completed')
 */
export const updateCustomerEnquiryStatus = async (
  id: string,
  status: CustomerEnquiry['status']
): Promise<any> => {
  try {
    const response = await api.patch(`customers/enquires/${id}`, { status });
    return (response as any)?.data || response;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      try {
        const fallback = await api.patch(`customers/enquiries/${id}`, { status });
        return (fallback as any)?.data || fallback;
      } catch {
        // Fallback or ignore if backend has no PATCH endpoint
      }
    }
    console.warn(`[customerEnquiriesApi] Could not update status on server for ${id}:`, error);
    return null;
  }
};

/**
 * DELETE customers/enquires/:id
 * Deletes or removes an enquiry
 */
export const deleteCustomerEnquiry = async (id: string): Promise<any> => {
  try {
    const response = await api.delete(`customers/enquires/${id}`);
    return (response as any)?.data || response;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      const fallback = await api.delete(`customers/enquiries/${id}`);
      return (fallback as any)?.data || fallback;
    }
    throw error;
  }
};
