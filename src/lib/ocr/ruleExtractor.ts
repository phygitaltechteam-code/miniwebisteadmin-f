// Faithful port of the Android app's RuleBasedExtractor.kt: keep the two in sync (same fixture, same baseline).
//
// 1. Lines are tidied: emails or web addresses that OCR wrapped onto two lines are re-joined.
// 2. Emails, websites/social links and phone numbers are found with patterns (phones via libphonenumber,
//    labelled from "M:", "Tel", "Fax"…) and removed from their lines. Tax IDs (GSTIN/PAN/CIN) go to Notes
//    and are format-checked.
// 3. What's left is scored with context: job-title words; company suffixes or a match with the email/website
//    domain; address words, PIN codes and city names, joined across lines stacked in one column; name shape,
//    boosted when it matches the email, sits right above/below the title, or is printed beside its own number.
//    "Name, Title" on one line is split. Line positions (when OCR provides them) decide what counts as "next to".
// 4. Weak guesses and text OCR found hard to read are flagged for review.
import * as D from './dictionaries';
import {findPhones} from './phone';
import {allValid} from './taxIds';
import {
  emptyLead,
  type Box,
  type ExtractedLead,
  type Extraction,
  type FieldKey,
  type FoundPhone,
  type OcrLine,
  type PhoneKind,
} from './types';

const STRONG = 3;
/** OCR line confidence below this means the text itself may be misread. Tune on real cards (Tesseract ≠ ML Kit). */
export const LOW_CONFIDENCE = 0.6;

// Kotlin regexes, ported: (?i) → i flag, `matches` → ^…$. Global copies are made where Kotlin used findAll/replace.
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;
const URL_RE = new RegExp(
  '\\b(?:' +
    // Anything that starts with http(s):// or www. is a web address, whatever its ending (.studio, .agency…).
    '(?:https?://|www\\.)[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.[a-z]{2,24}' +
    '|' +
    // Otherwise only the common endings, so "Pvt.Ltd" or "No.5" never look like websites.
    '[a-z0-9][a-z0-9-]*(?:\\.[a-z0-9-]+)*' +
    '\\.(?:com|in|co|org|net|io|biz|info|us|uk|ae|ai|app|dev|tech|store|online|site|xyz|me|edu|gov|studio|agency|design)' +
    '(?:\\.[a-z]{2})?' +
    ')\\b(?:/[^\\s,|]*)?',
  'i',
);
const DOMAIN_TAIL = /^\.?[a-z0-9-]*(\.[a-z]{2,24})+$/i;
const TAX_ID =
  /\b(gstin|gst\s*no|gst|pan|cin|vat|tin|uin|iec)\b\s*(no\.?|number|#)?\s*[:.-]\s*[A-Z0-9]/i;
const PIN = /(?<![\d+])\d{3}\s?\d{3}(?!\d)|\b\d{5}(?:-\d{4})?\b/;
const ADDRESS_LABEL =
  /^\s*(address|addr|add|office|regd\.? office|works|factory)\s*[:.-]/i;
const NAME_WORD = /^(?:[A-Z][A-Za-z'.-]*|[A-Z]\.?)$/;
const LABELS = new RegExp(
  '(?<![a-z])(e-?mail|email|mail|web(site)?|url|w|e|linkedin|tel(ephone)?|ph(one)?|mob(ile)?|cell|' +
    'fax|telefax|whatsapp|off(ice)?|direct|board|landline|contact|call|helpline|enquir(y|ies)|support|' +
    'toll ?free|ext(n)?|extension|m|t|p|f|o|d|c)(?![a-z])\\s*[.:]?',
  'gi',
);
const NAME_TITLE_SEPARATOR = /\s*[|,•·–—]\s*|\s+-\s+/;
const WORD_SPLIT = /[^a-z0-9&-]+/;
const SOCIAL_SITES = [
  'instagram.',
  'facebook.',
  'fb.com',
  'twitter.',
  'x.com',
  'youtube.',
  'youtu.be',
];
// prettier-ignore
const TLD_PARTS = new Set([
  'www', 'com', 'in', 'co', 'org', 'net', 'io', 'biz', 'info', 'us', 'uk', 'ae', 'ai', 'app', 'dev',
  'tech', 'store', 'online', 'site', 'xyz', 'me', 'edu', 'gov', 'ac', 'mail', 'studio', 'agency', 'design',
]);
const CITY_PATTERNS = Array.from(D.cities).map(
  (c) => new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
);

const withG = (re: RegExp) =>
  new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
const EMAIL_ALL = withG(EMAIL);
const URL_ALL = withG(URL_RE);

// Kotlin Char helpers.
const LETTER = /\p{L}/u;
const UPPER = /\p{Lu}/u;
const isLetter = (c: string) => LETTER.test(c);
const countLetters = (s: string) => (s.match(/\p{L}/gu) || []).length;
const countDigits = (s: string) => (s.match(/\p{Nd}/gu) || []).length;
const hasDigit = (s: string) => /\p{Nd}/u.test(s);
const lettersAndDigits = (s: string) => s.replace(/[^\p{L}\p{Nd}]/gu, '');
const splitWords = (text: string) =>
  text
    .toLowerCase()
    .split(WORD_SPLIT)
    .filter((w) => w !== '');
const tokensOf = (text: string) => text.split(' ').filter((t) => t !== '');
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function trimChars(s: string, chars: string, start = true): string {
  let a = 0;
  let b = s.length;
  if (start) while (a < b && chars.includes(s[a])) a++;
  while (b > a && chars.includes(s[b - 1])) b--;
  return s.slice(a, b);
}
const trimEnd = (s: string, chars: string) => trimChars(s, chars, false);

const distinct = <T>(list: T[]) => Array.from(new Set(list));

/** Kotlin maxByOrNull: the first element with the largest value. */
function maxBy<T>(list: T[], value: (t: T) => number): T | null {
  let best: T | null = null;
  let bestValue = -Infinity;
  for (const item of list) {
    const v = value(item);
    if (best === null || v > bestValue) {
      best = item;
      bestValue = v;
    }
  }
  return best;
}

const boxHeight = (b: Box) => b.bottom - b.top;

class Candidate {
  readonly height: number;
  readonly words: string[];
  readonly hasLegal: boolean;
  readonly titleWord: string | undefined;
  readonly isTitle: boolean;
  readonly nameShaped: boolean;
  nameScore = 0;
  companyScore = 0;
  addressScore = 0;
  readonly nameWhy: string[] = [];
  readonly companyWhy: string[] = [];

  constructor(
    readonly text: string,
    readonly index: number,
    readonly line: OcrLine,
    besidePhone = false,
    /** Came from splitting "Name, Title" on one line. */
    readonly partOfLine = false,
  ) {
    this.height = line.height ?? 0;
    this.words = splitWords(text);
    this.hasLegal = this.words.some((w) => D.legalWords.has(w));
    this.titleWord = this.words.find((w) => D.strongTitleWords.has(w));
    this.isTitle =
      !this.hasLegal && this.titleWord !== undefined && countDigits(text) < 2;

    const tokens = tokensOf(text);
    const hasHonorific =
      tokens.length > 1 &&
      D.honorifics.has(trimEnd(tokens[0].toLowerCase(), '.'));
    const nameTokens = hasHonorific ? tokens.slice(1) : tokens;
    const minTokens = hasHonorific || besidePhone ? 1 : 2;
    this.nameShaped =
      !this.isTitle &&
      !this.hasLegal &&
      nameTokens.length >= minTokens &&
      nameTokens.length <= 4 &&
      nameTokens.every((t) => NAME_WORD.test(t)) &&
      !this.words.some(
        (w) => D.companyWords.has(w) || D.strongTitleWords.has(w),
      );
    if (hasHonorific) {
      this.nameScore += STRONG;
      this.nameWhy.push(`Starts with ${tokens[0]}`);
    }
    if (besidePhone && this.nameShaped) {
      this.nameScore += 2;
      this.nameWhy.push('Printed beside a phone number');
    }
    if (partOfLine && this.nameShaped) {
      this.nameScore += 2;
      this.nameWhy.push('Written with the job title');
    }
  }

  score(domainStems: string[], emailLocals: string[], maxHeight: number) {
    const text = this.text;
    const words = this.words;
    const lower = text.toLowerCase();
    const compact = lettersAndDigits(lower);
    const tall = maxHeight > 0 && this.height >= maxHeight * 0.9;

    if (this.nameShaped) {
      const tokens = words.filter((w) => w.length >= 3 && !D.honorifics.has(w));
      if (emailLocals.some((local) => tokens.some((t) => local.includes(t)))) {
        this.nameScore += STRONG;
        this.nameWhy.unshift('Matches the email address');
      }
      if (tall) {
        this.nameScore += 1;
        this.nameWhy.push('Largest text on the card');
      }
      if (this.index === 0) this.nameScore += 1;
    }

    if (this.hasLegal) {
      this.companyScore += 4;
      this.companyWhy.push(
        `Has "${capitalize(words.find((w) => D.legalWords.has(w))!)}"`,
      );
    }
    const initials = words
      .filter((w) => isLetter(w[0]))
      .map((w) => w[0])
      .join('');
    const first = words[0];
    if (
      domainStems.some(
        (stem) =>
          compact.includes(stem) ||
          (first !== undefined &&
            first.length >= 3 &&
            stem.startsWith(first)) ||
          (initials.length >= 2 && stem === initials),
      )
    ) {
      this.companyScore += STRONG;
      this.companyWhy.unshift('Matches the email / website domain');
    }
    if (!this.isTitle && words.some((w) => D.companyWords.has(w))) {
      this.companyScore += 2;
      this.companyWhy.push(
        `Business word "${words.find((w) => D.companyWords.has(w))}"`,
      );
    }
    const letters = text.match(/\p{L}/gu) || [];
    if (letters.length > 0 && letters.every((c) => UPPER.test(c)))
      this.companyScore += 1;
    if (tall && !this.nameShaped) {
      this.companyScore += 1;
      this.companyWhy.push('Largest text on the card');
    }
    if (text.includes('&')) this.companyScore += 1;
    if (words.length > 5) this.companyScore -= 1; // slogans and service lists run long; company names don't
    if (this.partOfLine) this.companyScore -= 2;

    if (PIN.test(text)) this.addressScore += 3;
    if (ADDRESS_LABEL.test(text)) this.addressScore += 3;
    this.addressScore += Math.min(
      words.filter((w) => D.addressWords.has(w)).length,
      3,
    );
    if (CITY_PATTERNS.some((re) => re.test(lower))) this.addressScore += 2;
    if (hasDigit(text)) this.addressScore += 1;
    if (text.includes(',')) this.addressScore += 1;
    if (this.hasLegal && !PIN.test(text)) this.addressScore = 0;
    if (this.partOfLine) this.addressScore = 0;
  }
}

export class RuleBasedExtractor {
  constructor(
    private readonly region: string = 'IN',
    private readonly lowConfidence: number = LOW_CONFIDENCE,
  ) {}

  extract(lines: OcrLine[]): Extraction {
    const clean = this.rejoinWrapped(
      lines
        .map((l) => ({...l, text: l.text.replace(/\s+/g, ' ').trim()}))
        .filter((l) => l.text !== ''),
    );
    let lead: ExtractedLead = {
      ...emptyLead(),
      extractionMethod: 'rules',
      rawText: clean.map((l) => l.text).join('\n'),
    };
    const uncertain = new Set<FieldKey>();
    const reasons: Partial<Record<FieldKey, string>> = {};

    const emails: string[] = [];
    const urls: string[] = [];
    const phones: [PhoneKind | null, FoundPhone][] = [];
    const candidates: Candidate[] = [];
    const notes: string[] = [];
    let notesSuspicious = false;

    clean.forEach((line, index) => {
      // Tax IDs (GSTIN, PAN, CIN…) matter for B2B leads but would otherwise be glued onto the address.
      if (TAX_ID.test(line.text)) {
        notes.push(line.text);
        if (!allValid(line.text)) notesSuspicious = true;
        return;
      }
      let text = line.text.replace(/\s*@\s*/g, '@');
      let hadContact = false;

      for (const m of text.match(EMAIL_ALL) || [])
        emails.push(trimEnd(m.toLowerCase(), '.'));
      if (EMAIL.test(text)) {
        text = text.replace(EMAIL_ALL, ' ');
        hadContact = true;
      }
      for (const m of text.match(URL_ALL) || []) urls.push(trimEnd(m, './'));
      if (URL_RE.test(text)) {
        text = text.replace(URL_ALL, ' ');
        hadContact = true;
      }
      const found = findPhones(text, this.region);
      if (found.length > 0) {
        let prevEnd = 0;
        for (const phone of found) {
          phones.push([
            this.labelBefore(text.substring(prevEnd, phone.start)),
            phone,
          ]);
          prevEnd = phone.end;
        }
        for (let i = found.length - 1; i >= 0; i--)
          text = text.slice(0, found[i].start) + text.slice(found[i].end);
        hadContact = true;
      }

      const rest = hadContact ? this.stripLabels(text) : text;
      if (countLetters(rest) >= 2) {
        const trimmed = trimChars(rest, ' ,|-/:;•·');
        // "Kavya Iyer | Head - Procurement" or "Arjun Rao, CEO": a name and a title sharing one line.
        const split = this.splitNameAndTitle(trimmed);
        if (split !== null && !hadContact) {
          candidates.push(new Candidate(split[0], index, line, false, true));
          candidates.push(new Candidate(split[1], index, line, false, true));
        } else {
          // "Salim : 98207 34264": a name printed next to its own number is a contact person.
          candidates.push(
            new Candidate(trimmed, index, line, found.length > 0),
          );
        }
      }
    });

    // Contacts
    const uniqueEmails = distinct(emails);
    if (uniqueEmails[0] !== undefined) {
      lead.email = uniqueEmails[0];
      reasons.email = 'Email address';
    }
    if (uniqueEmails[1] !== undefined) {
      lead.email2 = uniqueEmails[1];
      reasons.email2 = 'Second email address';
    }
    for (const url of distinct(urls)) {
      const lower = url.toLowerCase();
      if (lower.includes('linkedin.')) {
        if (lead.linkedIn === '') {
          lead.linkedIn = url;
          reasons.linkedIn = 'LinkedIn link';
        }
      } else if (SOCIAL_SITES.some((s) => lower.includes(s))) {
        lead.otherSocial = [lead.otherSocial, url]
          .filter((s) => s !== '')
          .join(', ');
        reasons.otherSocial = 'Social media link';
      } else if (lead.website === '') {
        lead.website = url;
        reasons.website = 'Web address';
      }
    }
    lead = this.assignPhones(lead, phones, reasons);
    for (const ext of distinct(
      phones.map(([, p]) => p.extension).filter((e): e is string => e !== null),
    )) {
      notes.push(`Phone extension: ${ext}`);
    }
    if (notes.length > 0) {
      lead.notes = notes.join('\n');
      reasons.notes = notesSuspicious
        ? "Tax ID doesn't match the official format: check the digits"
        : 'Tax ID / extras from the card';
      if (notesSuspicious) uncertain.add('notes');
    }

    // Free-text fields
    const stems = distinct(
      [...emails.map((e) => e.slice(e.indexOf('@') + 1)), ...urls]
        .map((d) => this.domainStem(d))
        .filter((s): s is string => s !== null),
    );
    const localParts = emails.map((e) => e.slice(0, e.indexOf('@')));
    const maxHeight = candidates.reduce((m, c) => Math.max(m, c.height), 0);
    candidates.forEach((c) => c.score(stems, localParts, maxHeight));

    const title = candidates.find((c) => c.isTitle) ?? null;
    if (title) {
      lead.jobTitle = title.text;
      reasons.jobTitle = `Job title word "${title.titleWord}"`;
    }

    const address = this.findAddress(candidates.filter((c) => c !== title));
    if (address.length > 0) {
      lead.address = address.map((c) => c.text).join(', ');
      reasons.address = address.some((c) => PIN.test(c.text))
        ? 'Has a PIN / ZIP code'
        : 'Address words like Road, Floor, Nagar';
    }

    const rest = candidates.filter((c) => c !== title && !address.includes(c));
    if (title) {
      rest.forEach((c) => {
        if (c.nameShaped && this.near(c, title)) {
          c.nameScore += 2;
          c.nameWhy.push('Right next to the job title');
        }
      });
    }

    let company = maxBy(
      rest.filter((c) => c.companyScore >= 2),
      (c) => c.companyScore,
    );
    const name = maxBy(
      rest.filter((c) => c !== company && c.nameShaped),
      (c) => c.nameScore,
    );
    if (company === null)
      company = maxBy(
        rest.filter((c) => c !== name && c.companyScore >= 1),
        (c) => c.companyScore,
      );

    if (name) {
      lead.name = name.text;
      reasons.name = name.nameWhy[0] ?? "Looks like a person's name";
      if (name.nameScore < STRONG) uncertain.add('name');
    }
    if (company) {
      lead.company = company.text;
      reasons.company =
        company.companyWhy[0] ?? "Largest text that isn't a name";
      if (company.companyScore < STRONG) uncertain.add('company');
    }
    if (
      address.length > 0 &&
      !address.some((c) => c.addressScore >= STRONG + 1)
    )
      uncertain.add('address');

    // Text OCR itself was unsure about: whatever field it landed in deserves a look.
    const read: [FieldKey, Candidate | null][] = [
      ['name', name],
      ['company', company],
      ['jobTitle', title],
    ];
    for (const [field, c] of read) {
      if (c && (c.line.confidence ?? 1) < this.lowConfidence) {
        uncertain.add(field);
        reasons[field] = 'Text was hard to read';
      }
    }

    // A missing name is the most common miss, so it always needs a human look.
    const needsReview =
      uncertain.size > 0 ||
      lead.name === '' ||
      [lead.mobile, lead.officePhone, lead.otherPhone, lead.email].every(
        (v) => v === '',
      );
    return {lead: {...lead, needsReview}, uncertain, reasons};
  }

  /**
   * Whether two lines sit next to each other on the card: stacked in the same column with at most about one line
   * of gap when positions are known, otherwise consecutive in reading order.
   */
  private near(a: Candidate, b: Candidate): boolean {
    if (a.index === b.index) return true; // two halves of one line
    const ba = a.line.box;
    const bb = b.line.box;
    if (!ba || !bb) return Math.abs(a.index - b.index) === 1;
    const gap = Math.max(bb.top - ba.bottom, ba.top - bb.bottom);
    const overlap = Math.min(ba.right, bb.right) - Math.max(ba.left, bb.left);
    const lineHeight = Math.max(boxHeight(ba), boxHeight(bb));
    return gap <= lineHeight * 1.5 && overlap > 0;
  }

  /** The best run of neighbouring address-like lines. */
  private findAddress(candidates: Candidate[]): Candidate[] {
    const groups: Candidate[][] = [];
    for (const c of candidates) {
      const lastGroup = groups[groups.length - 1];
      const last = lastGroup?.[lastGroup.length - 1];
      const joinable =
        c.addressScore >= 1 && !c.nameShaped && c.companyScore < 4;
      if (last && c.index > last.index && this.near(last, c) && joinable)
        lastGroup.push(c);
      else if (c.addressScore >= STRONG) groups.push([c]);
    }
    // Also pull in an address-like line just above a group (e.g. a building name before the street).
    for (const group of groups) {
      const first = group[0];
      let prev: Candidate | undefined;
      for (const c of candidates)
        if (c.index < first.index && this.near(c, first)) prev = c;
      if (
        prev &&
        prev.addressScore >= 2 &&
        !prev.nameShaped &&
        prev.companyScore < 4 &&
        !prev.isTitle
      )
        group.unshift(prev);
    }
    return (
      maxBy(groups, (g) => g.reduce((s, c) => s + c.addressScore, 0)) ?? []
    );
  }

  /** Splits "Name | Title", "Name, Title" or "Name - Title" (either order) when one side is a title and the other a name. */
  private splitNameAndTitle(text: string): [string, string] | null {
    // Kotlin split(limit = 2): split at the first separator only.
    const m = NAME_TITLE_SEPARATOR.exec(text);
    if (!m) return null;
    const parts = [
      text.slice(0, m.index).trim(),
      text.slice(m.index + m[0].length).trim(),
    ];
    if (parts.some((p) => p === '')) return null;
    const firstIsTitle = this.isTitleText(parts[0]);
    const secondIsTitle = this.isTitleText(parts[1]);
    if (firstIsTitle === secondIsTitle) return null;
    const [namePart, titlePart] = secondIsTitle
      ? [parts[0], text.substring(text.indexOf(parts[1]))]
      : [parts[1], parts[0]];
    const nameTokens = tokensOf(namePart);
    if (
      nameTokens.length < 2 ||
      nameTokens.length > 4 ||
      !nameTokens.every((t) => NAME_WORD.test(t))
    )
      return null;
    return [namePart, titlePart.trim()];
  }

  private isTitleText(text: string): boolean {
    const words = splitWords(text);
    return (
      words.some((w) => D.strongTitleWords.has(w)) &&
      !words.some((w) => D.legalWords.has(w))
    );
  }

  /**
   * OCR often wraps a long email or web address: "pooja@lakshmitextiles" / ".com". Re-joins such pairs so the
   * patterns can see the whole address. Only joins when the second line is just the rest of a domain.
   */
  private rejoinWrapped(lines: OcrLine[]): OcrLine[] {
    const out: OcrLine[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const next = lines[i + 1];
      const brokenEmail = line.text.includes('@') && !EMAIL.test(line.text);
      const brokenWeb =
        line.text.toLowerCase().startsWith('www.') && !URL_RE.test(line.text);
      if (next && (brokenEmail || brokenWeb) && DOMAIN_TAIL.test(next.text)) {
        out.push({...line, text: line.text + next.text.trim()});
        i += 2;
      } else {
        out.push(line);
        i++;
      }
    }
    return out;
  }

  private labelBefore(segment: string): PhoneKind | null {
    const parts = segment
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((p) => p !== '');
    const label = parts[parts.length - 1];
    if (label === undefined) return null;
    if (D.faxLabels.has(label)) return 'FAX';
    if (D.mobileLabels.has(label)) return 'MOBILE';
    if (D.officeLabels.has(label)) return 'OFFICE';
    return null;
  }

  private assignPhones(
    start: ExtractedLead,
    phones: [PhoneKind | null, FoundPhone][],
    reasons: Partial<Record<FieldKey, string>>,
  ): ExtractedLead {
    const lead = {...start};
    const extra: string[] = [];
    const seen = new Set<string>();
    for (const [label, phone] of phones) {
      if (seen.has(phone.formatted)) continue; // distinctBy { formatted }
      seen.add(phone.formatted);
      const why =
        label !== null
          ? 'Labelled on the card'
          : phone.numberKind !== null
            ? 'Number type'
            : 'Phone number';
      switch (label ?? phone.numberKind ?? 'MOBILE') {
        case 'MOBILE':
          if (lead.mobile === '') {
            lead.mobile = phone.formatted;
            reasons.mobile =
              label === null && phone.numberKind === 'MOBILE'
                ? 'Mobile number format'
                : why;
          } else extra.push(phone.formatted);
          break;
        case 'OFFICE':
          if (lead.officePhone === '') {
            lead.officePhone = phone.formatted;
            reasons.officePhone =
              label === null ? 'Landline number format' : why;
          } else extra.push(phone.formatted);
          break;
        case 'FAX':
          if (lead.fax === '') {
            lead.fax = phone.formatted;
            reasons.fax = 'Labelled Fax';
          } else extra.push(phone.formatted);
          break;
      }
    }
    if (extra.length > 0) {
      reasons.otherPhone = 'More numbers on the card';
      lead.otherPhone = extra.join(', ');
    }
    return lead;
  }

  /** Removes "M:", "Tel.", "E-mail:" style labels left behind after taking out the contact itself. */
  private stripLabels(text: string): string {
    return text.replace(LABELS, ' ').replace(/\s+/g, ' ').trim();
  }

  /** "nimbus" from "mail.nimbus.co.in" or "https://www.nimbus.in/about"; null for free mail providers. */
  private domainStem(domainOrUrl: string): string | null {
    let host = domainOrUrl.toLowerCase();
    const scheme = host.indexOf('://');
    if (scheme >= 0) host = host.slice(scheme + 3);
    const slash = host.indexOf('/');
    if (slash >= 0) host = host.slice(0, slash);
    const parts = host.split('.').filter((p) => p !== '' && !TLD_PARTS.has(p));
    const stem = parts[parts.length - 1];
    if (stem === undefined) return null;
    return stem.length >= 2 && !D.freeMailDomains.has(stem) ? stem : null;
  }
}

/** Reads one card's OCR lines with the offline rules. */
export const extractCard = (
  lines: OcrLine[],
  region = 'IN',
  lowConfidence = LOW_CONFIDENCE,
): Extraction => new RuleBasedExtractor(region, lowConfidence).extract(lines);
