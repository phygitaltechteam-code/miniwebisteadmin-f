// Types for the in-browser card reader (port of the Android app's extract package).
// Self-contained on purpose: the OCR library depends on nothing else in the app.

/** A line's position on the card image, in pixels. */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * One line of OCR text. `height` is the text height in pixels (0 if unknown); bigger usually means name or company.
 * `box` and `confidence` (0..1) come from the OCR engine when available; `block` groups lines read as one paragraph.
 */
export interface OcrLine {
  text: string;
  height?: number;
  box?: Box | null;
  confidence?: number | null;
  block?: number;
}

/** The 14 editable contact fields, in form / export column order (same names as Lead.kt and the API). */
export type FieldKey =
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

export const FIELDS: {key: FieldKey; label: string}[] = [
  {key: 'name', label: 'Name'},
  {key: 'jobTitle', label: 'Job title'},
  {key: 'company', label: 'Company'},
  {key: 'mobile', label: 'Mobile'},
  {key: 'officePhone', label: 'Office phone'},
  {key: 'otherPhone', label: 'Other phone'},
  {key: 'fax', label: 'Fax'},
  {key: 'email', label: 'Email'},
  {key: 'email2', label: 'Email 2'},
  {key: 'website', label: 'Website'},
  {key: 'address', label: 'Address'},
  {key: 'linkedIn', label: 'LinkedIn'},
  {key: 'otherSocial', label: 'Other social'},
  {key: 'notes', label: 'Notes'},
];

/** What the reader fills in. Empty fields are '' (convert to null only when talking to the API). */
export type ExtractedLead = Record<FieldKey, string> & {
  rawText: string;
  extractionMethod: string;
  needsReview: boolean;
};

/**
 * Extracted lead, the fields filled on weak evidence (to be checked), and a short reason per filled field
 * ("Matches the email address") so the review form can show why a value was chosen.
 */
export interface Extraction {
  lead: ExtractedLead;
  uncertain: Set<FieldKey>;
  reasons: Partial<Record<FieldKey, string>>;
}

export type PhoneKind = 'MOBILE' | 'OFFICE' | 'FAX';

export interface FoundPhone {
  start: number;
  end: number;
  /** Readable international form without any extension, e.g. "+91 22 2345 6789", so it can be dialled. */
  formatted: string;
  /** Kind implied by the number itself; null when the number could be either. */
  numberKind: PhoneKind | null;
  /** "21" for "… Extn. 21"; kept separately so the main number stays dialable. */
  extension: string | null;
}

export const emptyLead = (): ExtractedLead => ({
  name: '',
  jobTitle: '',
  company: '',
  mobile: '',
  officePhone: '',
  otherPhone: '',
  fax: '',
  email: '',
  email2: '',
  website: '',
  address: '',
  linkedIn: '',
  otherSocial: '',
  notes: '',
  rawText: '',
  extractionMethod: 'rules',
  needsReview: false,
});
