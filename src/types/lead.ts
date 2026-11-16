// Lead types shared by the Leads page, the lead form and the in-browser card scanner.
// Field names match service-point's `lead` model (and the Android app's Lead.kt).

export type LeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'WON' | 'LOST';
export type LeadSource = 'SCAN' | 'MANUAL' | 'ENQUIRY' | 'EXCHANGE';

/** The 14 editable contact fields, in form / export column order. */
export type LeadFieldKey =
  | 'name'
  | 'jobTitle'
  | 'company'
  | 'mobile'
  | 'officePhone'
  | 'otherPhone'
  | 'fax'
  | 'email'
  | 'email2'
  | 'website'
  | 'address'
  | 'linkedIn'
  | 'otherSocial'
  | 'notes';

export type LeadFieldType = 'text' | 'phone' | 'email' | 'url' | 'multiline';

export const LEAD_FIELDS: {
  key: LeadFieldKey;
  label: string;
  type: LeadFieldType;
}[] = [
  {key: 'name', label: 'Name', type: 'text'},
  {key: 'jobTitle', label: 'Job title', type: 'text'},
  {key: 'company', label: 'Company', type: 'text'},
  {key: 'mobile', label: 'Mobile', type: 'phone'},
  {key: 'officePhone', label: 'Office phone', type: 'phone'},
  {key: 'otherPhone', label: 'Other phone', type: 'phone'},
  {key: 'fax', label: 'Fax', type: 'phone'},
  {key: 'email', label: 'Email', type: 'email'},
  {key: 'email2', label: 'Email 2', type: 'email'},
  {key: 'website', label: 'Website', type: 'url'},
  {key: 'address', label: 'Address', type: 'multiline'},
  {key: 'linkedIn', label: 'LinkedIn', type: 'url'},
  {key: 'otherSocial', label: 'Other social', type: 'text'},
  {key: 'notes', label: 'Notes', type: 'multiline'},
];

export const LEAD_STATUSES: {value: LeadStatus; label: string}[] = [
  {value: 'NEW', label: 'New'},
  {value: 'CONTACTED', label: 'Contacted'},
  {value: 'INTERESTED', label: 'Interested'},
  {value: 'WON', label: 'Won'},
  {value: 'LOST', label: 'Lost'},
];

export const LEAD_SOURCES: {value: LeadSource; label: string}[] = [
  {value: 'SCAN', label: 'Scan'},
  {value: 'MANUAL', label: 'Manual'},
  {value: 'ENQUIRY', label: 'Enquiry'},
  {value: 'EXCHANGE', label: 'Card exchange'},
];

/** 0 none, 1 low, 2 medium, 3 high. */
export const LEAD_PRIORITIES: {value: number; label: string}[] = [
  {value: 0, label: 'None'},
  {value: 1, label: 'Low'},
  {value: 2, label: 'Medium'},
  {value: 3, label: 'High'},
];

export interface Lead {
  id: string;
  adminId: string;
  createdById: string | null;
  capturedBy: string | null;
  name: string | null;
  jobTitle: string | null;
  company: string | null;
  mobile: string | null;
  officePhone: string | null;
  otherPhone: string | null;
  fax: string | null;
  email: string | null;
  email2: string | null;
  website: string | null;
  address: string | null;
  linkedIn: string | null;
  otherSocial: string | null;
  notes: string | null;
  event: string | null;
  status: LeadStatus;
  priority: number;
  /** ISO string at UTC midnight of the follow-up day. Read its UTC date part. */
  followUpAt: string | null;
  starred: boolean;
  needsReview: boolean;
  source: LeadSource;
  extractionMethod: string | null;
  rawText: string | null;
  imageFront: string | null;
  imageBack: string | null;
  enquiryId: string | null;
  scannedAt: string | null;
  modifiedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Body for POST /leads and PATCH /leads/:id. `followUpAt` is sent as 'YYYY-MM-DD'
 * (or null to clear it); the server stores it as UTC midnight.
 */
export type LeadInput = Partial<
  Omit<
    Lead,
    | 'adminId'
    | 'createdById'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'modifiedAt'
    | 'imageFront'
    | 'imageBack'
  >
>;

export interface LeadListParams {
  search?: string;
  /** One or more statuses; sent comma-separated. */
  status?: LeadStatus[];
  /** Minimum priority (1-3). */
  priority?: number;
  event?: string;
  source?: LeadSource;
  starred?: boolean;
  /** 'YYYY-MM-DD': follow-ups due on or before this day (WON/LOST excluded). */
  dueBy?: string;
  page?: number;
  /** Max 500. */
  limit?: number;
}

export interface LeadPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LeadListResponse {
  leads: Lead[];
  pagination: LeadPagination;
}

export interface CardStatCounts {
  views: number;
  calls: number;
  whatsapp: number;
  emails: number;
  saves: number;
}

export interface CardStatDay extends CardStatCounts {
  /** 'YYYY-MM-DD' (Asia/Kolkata day). */
  day: string;
}

export interface CardStats {
  days: number;
  totals: CardStatCounts;
  daily: CardStatDay[];
}

export interface LeadTemplates {
  whatsapp: string;
  emailSubject: string;
  emailBody: string;
}

/** GET /leads/platform-match: is this lead's business already on digiwebcard? */
export interface PlatformMatch {
  matched: boolean;
  adminId?: string;
  businessName?: string;
  cardLink?: string;
  matchedBy?: 'phone' | 'company';
}

/** The business's own public links, for {card_link} / {review_link} (GET {base}/info). */
export interface CardLinks {
  cardLink: string;
  reviewLink: string;
}
