// Customers of a business: won leads moved over, or added by hand.
// Field names match service-point's `customer` model.
import type {Lead, LeadPagination} from './lead';

export interface Customer {
  id: string;
  adminId: string;
  /** The lead this customer was made from (POST /leads/:id/to-customer), if any. */
  leadId: string | null;
  fullname: string;
  phoneNumber: string;
  secondaryPhoneNumber: string | null;
  email: string | null;
  address: string | null;
  company: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body for POST /customers and PATCH /customers/:id. */
export type CustomerInput = Partial<
  Pick<
    Customer,
    | 'fullname'
    | 'phoneNumber'
    | 'secondaryPhoneNumber'
    | 'email'
    | 'address'
    | 'company'
    | 'notes'
  >
>;

export interface CustomerListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CustomerListResponse {
  customers: Customer[];
  pagination: LeadPagination;
}

/** POST /leads/:id/to-customer (idempotent; the lead becomes WON). */
export interface LeadToCustomerResult {
  customer: Customer;
  lead: Lead;
}
