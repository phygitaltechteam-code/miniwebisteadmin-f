// Follow-up message templates, ported from the Android app's data/Templates.kt.
// Placeholders: {name}, {first_name}, {company}, {event}, {my_name}, {at_event}, which
// becomes " at <event>" or nothing when the lead has no event, and {card_link} / {review_link}:
// the business's public card and its reviews (card link + ?review=1).
import type {Lead} from '../../types/lead';

export type TemplateLead = Partial<
  Pick<
    Lead,
    | 'name'
    | 'company'
    | 'event'
    | 'mobile'
    | 'officePhone'
    | 'otherPhone'
    | 'email'
    | 'email2'
  >
>;

const HONORIFICS = new Set([
  'mr',
  'mrs',
  'ms',
  'miss',
  'dr',
  'er',
  'ca',
  'cs',
  'adv',
  'prof',
  'shri',
  'smt',
  'sri',
]);

const str = (v?: string | null) => (v ?? '').trim();
const replaceAll = (s: string, find: string, value: string) =>
  s.split(find).join(value);

/** First word of the name that isn't an honorific such as "Dr." or "Mr", or ''. */
export const firstName = (name?: string | null): string =>
  str(name)
    .split(' ')
    .find(
      (w) =>
        w.trim() !== '' && !HONORIFICS.has(w.replace(/\.+$/, '').toLowerCase()),
    ) ?? '';

/** The business's own links for {card_link} and {review_link} (from GET {base}/info). */
export interface TemplateLinks {
  cardLink?: string | null;
  reviewLink?: string | null;
}

/** Review link for a card link: the server's reviewLink, else cardLink + review=1. */
export const reviewLinkFor = (links?: TemplateLinks): string => {
  const review = str(links?.reviewLink);
  if (review) return review;
  const card = str(links?.cardLink);
  if (!card) return '';
  return `${card}${card.includes('?') ? '&' : '?'}review=1`;
};

export const fillTemplate = (
  template: string,
  lead: TemplateLead,
  myName: string,
  links?: TemplateLinks,
): string => {
  const name = str(lead.name);
  const first = firstName(name);
  const event = str(lead.event);
  let out = template;
  out = replaceAll(out, '{first_name}', first || 'there');
  out = replaceAll(out, '{name}', name || 'there');
  out = replaceAll(out, '{company}', str(lead.company));
  out = replaceAll(out, '{at_event}', event ? ` at ${event}` : '');
  out = replaceAll(out, '{event}', event);
  out = replaceAll(out, '{my_name}', (myName ?? '').trim());
  out = replaceAll(out, '{card_link}', str(links?.cardLink));
  out = replaceAll(out, '{review_link}', reviewLinkFor(links));
  return out
    .split(/\r\n|\n|\r/)
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .trim();
};

/** The number to dial: mobile first, then office, then the first other number. */
export const callNumber = (lead: TemplateLead): string | null => {
  const candidates = [
    str(lead.mobile),
    str(lead.officePhone),
    str((lead.otherPhone ?? '').split(',')[0]),
  ];
  return candidates.find((n) => n !== '') ?? null;
};

/**
 * Digits for a wa.me link (country code, no +), from the mobile or the first other number
 * that looks like a full number; null if none. Numbers without a country code use
 * [defaultCountryCode] (India by default, like the app's default region).
 */
export const whatsAppNumber = (
  lead: TemplateLead,
  defaultCountryCode = '91',
): string | null => {
  const candidates = [
    str(lead.mobile),
    ...(lead.otherPhone ?? '').split(',').map((s) => s.trim()),
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    let digits = raw.replace(/\D/g, '');
    if (raw.startsWith('+')) {
      if (digits.length >= 8 && digits.length <= 15) return digits;
      continue;
    }
    if (digits.startsWith('00')) {
      digits = digits.slice(2);
      if (digits.length >= 8 && digits.length <= 15) return digits;
      continue;
    }
    digits = digits.replace(/^0+/, '');
    if (digits.length === 10) return `${defaultCountryCode}${digits}`;
    if (digits.length === 12 && digits.startsWith(defaultCountryCode))
      return digits;
  }
  return null;
};

export const telHref = (number: string) =>
  `tel:${number.replace(/[^\d+]/g, '')}`;

export const whatsAppHref = (digits: string, text: string) =>
  `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const mailtoHref = (email: string, subject: string, body: string) =>
  `mailto:${email.trim().replace(/[\s?&#]/g, '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
