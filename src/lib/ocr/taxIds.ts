// Format checks for Indian business IDs printed on cards (port of TaxIds.kt). Used to flag a likely OCR misread
// (8↔B, 0↔O) for the user to check; values are never changed automatically.

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN = /^[A-Z]{3}[ABCFGHLJPT][A-Z]\d{4}[A-Z]$/;
const CIN = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;

/** GSTIN: 15 characters, state code 01–38, an embedded PAN, and a base-36 check character. */
export function isValidGstin(value: string): boolean {
  const v = value.trim().toUpperCase();
  if (!GSTIN.test(v)) return false;
  const state = parseInt(v.slice(0, 2), 10);
  if (state < 1 || state > 38) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = CHARS.indexOf(v[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return v[14] === CHARS[(36 - (sum % 36)) % 36];
}

export const isValidPan = (value: string) =>
  PAN.test(value.trim().toUpperCase());

export const isValidCin = (value: string) =>
  CIN.test(value.trim().toUpperCase());

/** Every ID found after a GSTIN/PAN/CIN label on this line has a valid format. Unknown labels are not judged. */
export function allValid(line: string): boolean {
  const upper = line.toUpperCase();
  const colon = upper.indexOf(':');
  let value = colon >= 0 ? upper.slice(colon + 1) : '';
  if (value === '') value = upper.slice(upper.lastIndexOf(' ') + 1);
  value = value.trim().replace(/ /g, '');
  if (upper.includes('GST')) return isValidGstin(value);
  if (upper.startsWith('PAN')) return isValidPan(value);
  if (upper.startsWith('CIN')) return isValidCin(value);
  return true;
}
