import { api } from '@/utils/axios';

/**
 * Reorder APIs (PATCH …/reorder). The request must hold every id of the list in the new order;
 * the response returns the list in its saved order.
 *   customers/…                      (customer)
 *   superAdmin/admin/:adminId/…      (super admin editing a customer)
 */
const base = (adminId?: string) => (adminId ? `superAdmin/admin/${adminId}` : 'customers');

export type ReorderList = 'products' | 'gallery' | 'videos' | 'about/documents';

/** PATCH {base}/{list}/reorder with { ids } (all ids, new order) */
export const reorderList = async (list: ReorderList, ids: string[], adminId?: string): Promise<any> => {
  const res = await api.patch(`${base(adminId)}/${list}/reorder`, { ids });
  return (res as any)?.data || res;
};

/**
 * PATCH {base}/links/reorder with { linkOrder }.
 * Fixed links use their field name (whatsappLinks, instagramLink, …); custom links use `custom:<index in customLinks>`.
 */
export const reorderLinks = async (linkOrder: string[], adminId?: string): Promise<any> => {
  const res = await api.patch(`${base(adminId)}/links/reorder`, { linkOrder });
  return (res as any)?.data || res;
};

/** Backend error text for a failed reorder */
export const reorderErrorText = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;
