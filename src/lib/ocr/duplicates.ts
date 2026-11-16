// Port of DuplicateChecker.kt. Works on any lead-like object (the API's nullable fields or the reader's '' fields).
import {normalizePhone} from './phone';
import {FIELDS, type FieldKey} from './types';

type Text = string | null | undefined;

export type LeadLike = Partial<Record<FieldKey, Text>> & {
  id?: string | null;
  imageFront?: Text;
  imageBack?: Text;
  rawText?: Text;
  needsReview?: boolean;
};

/** Shared inboxes say nothing about which person a card belongs to. */
// prettier-ignore
const sharedMailboxes = new Set([
  'info', 'sales', 'contact', 'enquiry', 'enquiries', 'inquiry', 'support', 'admin', 'office', 'hello',
  'mail', 'hr', 'accounts', 'marketing', 'service', 'care', 'booking', 'bookings', 'orders',
]);

const str = (v: Text) => v ?? '';
const isBlank = (v: Text) => str(v).trim() === '';

/**
 * An existing lead that is probably the same person: same personal email, same mobile number,
 * or a near-identical name + company. Office and fax numbers are ignored because colleagues share them.
 */
export function findDuplicate<T extends LeadLike>(
  lead: LeadLike,
  existing: T[],
  region: string,
): T | null {
  const emails = personalEmails(lead);
  const phones = mobiles(lead, region);
  const key = nameCompanyKey(lead);
  return (
    existing.find((other) => {
      if (lead.id != null && other.id === lead.id) return false;
      const otherEmails = personalEmails(other);
      if (Array.from(emails).some((e) => otherEmails.has(e))) return true;
      const otherPhones = mobiles(other, region);
      if (Array.from(phones).some((p) => otherPhones.has(p))) return true;
      const otherKey = nameCompanyKey(other);
      return (
        key !== null && otherKey !== null && similarity(key, otherKey) >= 0.85
      );
    }) ?? null
  );
}

/**
 * Fills `existing`'s empty fields from `incoming`. Values that differ are not overwritten;
 * they are kept in Notes so nothing from the new scan is lost.
 */
export function merge<T extends LeadLike>(existing: T, incoming: LeadLike): T {
  const conflicts: string[] = [];
  const merged: T = {...existing};
  for (const {key, label} of FIELDS) {
    const old = str(merged[key]).trim();
    const value = str(incoming[key]).trim();
    if (value === '' || old.toLowerCase() === value.toLowerCase()) continue;
    if (old === '') merged[key] = value as T[FieldKey];
    else if (key === 'notes') merged[key] = `${old}\n${value}` as T[FieldKey];
    else conflicts.push(`${label}: ${value}`);
  }
  if (conflicts.length > 0) {
    const note = 'From a later scan: ' + conflicts.join('; ');
    merged.notes = [str(merged.notes), note]
      .filter((s) => !isBlank(s))
      .join('\n') as T['notes'];
  }
  return {
    ...merged,
    imageFront: existing.imageFront ?? incoming.imageFront ?? null,
    imageBack: existing.imageBack ?? incoming.imageBack ?? null,
    rawText: Array.from(
      new Set(
        [str(existing.rawText), str(incoming.rawText)].filter(
          (s) => !isBlank(s),
        ),
      ),
    ).join('\n---\n'),
    needsReview: false,
  };
}

function personalEmails(lead: LeadLike): Set<string> {
  return new Set(
    [lead.email, lead.email2]
      .map((e) => str(e).trim().toLowerCase())
      .filter(
        (e) =>
          e.includes('@') && !sharedMailboxes.has(e.slice(0, e.indexOf('@'))),
      ),
  );
}

function mobiles(lead: LeadLike, region: string): Set<string> {
  return new Set(
    [str(lead.mobile), ...str(lead.otherPhone).split(',')]
      .map((p) => (p.trim() === '' ? null : normalizePhone(p, region)))
      .filter((p): p is string => p !== null),
  );
}

/** Needs both a name and a company: a bare name alone matches too many different people. */
function nameCompanyKey(lead: LeadLike): string | null {
  const name = str(lead.name)
    .toLowerCase()
    .replace(/[^\p{L}]/gu, '');
  const company = str(lead.company)
    .toLowerCase()
    .replace(/[^\p{L}\p{Nd}]/gu, '');
  return name === '' || company === '' ? null : `${name}|${company}`;
}

export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

function levenshtein(a: string, b: string): number {
  let prev = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}
