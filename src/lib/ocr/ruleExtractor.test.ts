// Ports of the Android tests: ExtractorAccuracyTest (fixture accuracy), RuleBasedExtractorTest and AccuracyHelpersTest.
import {describe, expect, it} from 'vitest';
import cardsJson from './__fixtures__/cards.json';
import {normalizePhone} from './phone';
import {RuleBasedExtractor} from './ruleExtractor';
import {allValid, isValidCin, isValidGstin, isValidPan} from './taxIds';
import {FIELDS, type Box, type FieldKey, type OcrLine} from './types';

const ENUM_TO_KEY: Record<string, FieldKey> = {
  NAME: 'name',
  JOB_TITLE: 'jobTitle',
  COMPANY: 'company',
  MOBILE: 'mobile',
  OFFICE_PHONE: 'officePhone',
  OTHER_PHONE: 'otherPhone',
  FAX: 'fax',
  EMAIL: 'email',
  EMAIL2: 'email2',
  WEBSITE: 'website',
  ADDRESS: 'address',
  LINKEDIN: 'linkedIn',
  OTHER_SOCIAL: 'otherSocial',
  NOTES: 'notes',
};
const PHONE_FIELDS = new Set<FieldKey>([
  'mobile',
  'officePhone',
  'otherPhone',
  'fax',
]);

/** Kotlin baseline in ExtractorAccuracyTest. Raise it whenever the extractor improves; never lower it to make a change pass. */
const BASELINE = 0.98;

interface RawCard {
  id: string;
  region?: string;
  lines: {t: string; h?: number; box?: number[]}[];
  expected: Record<string, string>;
}

function loadCards() {
  return (cardsJson.cards as unknown as RawCard[]).map((c) => ({
    id: c.id,
    region: c.region ?? 'IN',
    lines: c.lines.map((l): OcrLine => {
      const box: Box | null = l.box
        ? {left: l.box[0], top: l.box[1], right: l.box[2], bottom: l.box[3]}
        : null;
      return {text: l.t, height: l.h ?? (box ? box.bottom - box.top : 0), box};
    }),
    expected: Object.fromEntries(
      Object.entries(c.expected).map(([k, v]) => [ENUM_TO_KEY[k], v]),
    ) as Partial<Record<FieldKey, string>>,
  }));
}

/** Same as the Kotlin test's norm(). */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,]+$/, '');
const digits = (s: string) => s.replace(/\D/g, '');
const same = (field: FieldKey, want: string, got: string) =>
  PHONE_FIELDS.has(field)
    ? digits(want) === digits(got)
    : norm(want) === norm(got);

describe('field accuracy on the labelled cards (ExtractorAccuracyTest)', () => {
  it(`stays at or above the Kotlin baseline (${BASELINE})`, () => {
    const cards = loadCards();
    const keys = FIELDS.map((f) => f.key);
    const support = Object.fromEntries(keys.map((k) => [k, 0])) as Record<
      FieldKey,
      number
    >;
    const produced = {...support};
    const correct = {...support};
    const failures: string[] = [];
    const formatOnly: string[] = [];

    for (const card of cards) {
      const lead = new RuleBasedExtractor(card.region).extract(card.lines).lead;
      for (const f of keys) {
        // Notes collect extras (tax IDs…); only scored when the card's label says what they should be.
        if (f === 'notes' && !(f in card.expected)) continue;
        const want = card.expected[f] ?? '';
        const got = lead[f];
        if (want) support[f]++;
        if (got) produced[f]++;
        if (want && same(f, want, got)) correct[f]++;
        if (!same(f, want, got))
          failures.push(`  ${card.id}.${f}: expected "${want}" got "${got}"`);
        else if (norm(want) !== norm(got))
          formatOnly.push(`  ${card.id}.${f}: Java "${want}" JS "${got}"`);
      }
    }

    const pct = (n: number) => `${Math.round(n * 100)}%`.padStart(8);
    const rows = keys
      .filter((f) => support[f] > 0 || produced[f] > 0)
      .map(
        (f) =>
          `${f.padEnd(14)} ${pct(correct[f] / Math.max(1, support[f]))} ${pct(correct[f] / Math.max(1, produced[f]))} ${String(support[f]).padStart(7)}`,
      );
    const totalSupport = keys.reduce((s, f) => s + support[f], 0);
    const totalCorrect = keys.reduce((s, f) => s + correct[f], 0);
    const overall = totalCorrect / totalSupport;
    const report = [
      `Field accuracy on ${cards.length} cards`,
      `${'field'.padEnd(14)} ${'recall'.padStart(8)} ${'precision'.padStart(8)} ${'cards'.padStart(7)}`,
      ...rows,
      `overall exact-match recall: ${(overall * 100).toFixed(1)}% (${totalCorrect}/${totalSupport} fields)`,
      'mistakes (wrong, missing or extra):',
      ...failures,
      'same digits, different phone formatting (libphonenumber-js vs Java libphonenumber):',
      ...formatOnly,
    ].join('\n');
    console.log(report);

    expect(overall, report).toBeGreaterThanOrEqual(BASELINE);
  });
});

const extract = (lines: string[], region = 'IN', heights: number[] = []) =>
  new RuleBasedExtractor(region).extract(
    lines.map((t, i) => ({text: t, height: heights[i] ?? 20})),
  );

describe('RuleBasedExtractor (RuleBasedExtractorTest)', () => {
  it('reads a classic Indian card', () => {
    const r = extract(
      [
        'Asha Patel',
        'Sales Director',
        'NIMBUS TECHNOLOGIES PVT. LTD.',
        'M: +91 98200 12345',
        'T: 022 2345 6789',
        'E: asha.patel@nimbustech.co.in',
        'www.nimbustech.co.in',
        'Plot No. 12, MIDC, Andheri East,',
        'Mumbai - 400093',
      ],
      'IN',
      [40, 24, 30],
    );
    const l = r.lead;
    expect(l.name).toBe('Asha Patel');
    expect(l.jobTitle).toBe('Sales Director');
    expect(l.company).toBe('NIMBUS TECHNOLOGIES PVT. LTD.');
    expect(l.mobile).toBe('+91 98200 12345');
    expect(l.officePhone).toBe('+91 22 2345 6789');
    expect(l.email).toBe('asha.patel@nimbustech.co.in');
    expect(l.website).toBe('www.nimbustech.co.in');
    expect(l.address).toBe('Plot No. 12, MIDC, Andheri East, Mumbai - 400093');
    expect(r.uncertain.size).toBe(0);
    expect(l.needsReview).toBe(false);
    expect(l.extractionMethod).toBe('rules');
  });

  it('reads a company-first card with an unlabelled phone and free mail', () => {
    const r = extract(
      [
        'Orbit Industries',
        'Rahul Mehta',
        'Proprietor',
        '98765 43210',
        'orbitindustries@gmail.com',
        'Shop 4, Laxmi Market, Station Road, Pune 411001',
      ],
      'IN',
      [36, 28, 20],
    );
    const l = r.lead;
    expect(l.company).toBe('Orbit Industries');
    expect(l.name).toBe('Rahul Mehta');
    expect(l.jobTitle).toBe('Proprietor');
    expect(l.mobile).toBe('+91 98765 43210');
    expect(l.email).toBe('orbitindustries@gmail.com');
    expect(l.address).toBe('Shop 4, Laxmi Market, Station Road, Pune 411001');
    expect(l.website).toBe('');
    expect(r.uncertain.has('company')).toBe(false);
  });

  it('reads a US card with fax and cell', () => {
    const r = extract(
      [
        'JOHN A. SMITH',
        'Vice President, Engineering',
        'Acme Robotics Inc.',
        '1200 Market Street, Suite 400',
        'San Francisco, CA 94103',
        'Tel 415-892-1234 Fax 415-892-1299',
        'Cell (415) 892-1277',
        'john.smith@acmerobotics.com',
        'acmerobotics.com',
      ],
      'US',
    );
    const l = r.lead;
    expect(l.name).toBe('JOHN A. SMITH');
    expect(l.jobTitle).toBe('Vice President, Engineering');
    expect(l.company).toBe('Acme Robotics Inc.');
    expect(l.address).toBe(
      '1200 Market Street, Suite 400, San Francisco, CA 94103',
    );
    // libphonenumber-js always separates international groups with spaces; Java's gives "+1 415-892-1234".
    // Same number, so dialling and duplicate checks (E.164) are unaffected.
    expect(l.officePhone).toBe('+1 415 892 1234');
    expect(l.fax).toBe('+1 415 892 1299');
    expect(l.mobile).toBe('+1 415 892 1277');
    expect(l.website).toBe('acmerobotics.com');
    expect(l.needsReview).toBe(false);
  });

  it('reads a doctor with two emails, two mobiles and LinkedIn', () => {
    const l = extract([
      'Dr. Priya Sharma',
      'Consultant Dermatologist',
      'SkinCare Clinic',
      'Mob: 99200 11111 / 88790 22222',
      'priya@skincareclinic.in | drpriya.sharma@gmail.com',
      'linkedin.com/in/priyasharma',
    ]).lead;
    expect(l.name).toBe('Dr. Priya Sharma');
    expect(l.jobTitle).toBe('Consultant Dermatologist');
    expect(l.company).toBe('SkinCare Clinic');
    expect(l.mobile).toBe('+91 99200 11111');
    expect(l.otherPhone).toBe('+91 88790 22222');
    expect(l.email).toBe('priya@skincareclinic.in');
    expect(l.email2).toBe('drpriya.sharma@gmail.com');
    expect(l.linkedIn).toBe('linkedin.com/in/priyasharma');
    expect(l.website).toBe('');
  });

  it('flags a company-only card for review', () => {
    const l = extract(
      [
        'GREENLEAF ORGANICS',
        'Wholesale Fruits & Vegetables',
        'Shop No. 23, APMC Market, Vashi, Navi Mumbai - 400703',
        'Ph: 022-2788 1234',
        'greenleaforganics.in',
      ],
      'IN',
      [34, 18, 16, 16, 16],
    ).lead;
    expect(l.company).toBe('GREENLEAF ORGANICS');
    expect(l.name).toBe('');
    expect(l.officePhone).toBe('+91 22 2788 1234');
    expect(l.website).toBe('greenleaforganics.in');
    expect(l.address).toBe(
      'Shop No. 23, APMC Market, Vashi, Navi Mumbai - 400703',
    );
    expect(l.needsReview).toBe(true);
  });

  it('takes contact persons listed beside their numbers', () => {
    const r = extract(
      [
        'Al-Madina Caterers',
        'Best Food & Best Catering Service',
        'Salim : 9820734264',
        'Shamsher : 7900113303',
        'E-mail : almadinacaterers@gmail.com',
        'Tata Nagar, Near Sunni Jama Masjid, Govandi (W),',
        'Mumbai - 400 043.',
      ],
      'IN',
      [60, 24, 26, 26, 24, 22, 22],
    );
    const l = r.lead;
    expect(l.company).toBe('Al-Madina Caterers');
    expect(l.name).toBe('Salim');
    expect(l.mobile).toBe('+91 98207 34264');
    expect(l.otherPhone).toBe('+91 79001 13303');
    expect(l.email).toBe('almadinacaterers@gmail.com');
    expect(l.address).toBe(
      'Tata Nagar, Near Sunni Jama Masjid, Govandi (W), Mumbai - 400 043.',
    );
    expect(r.uncertain.has('name')).toBe(true); // a first name alone is worth a look
  });

  it('puts a tax ID in notes, not the address', () => {
    const l = extract([
      'Rohan Deshmukh',
      'Office No. 402, Sai Plaza, Baner Road,',
      'Pune - 411045, Maharashtra',
      'GSTIN: 27ABCDE1234F1Z5',
    ]).lead;
    expect(l.address).toBe(
      'Office No. 402, Sai Plaza, Baner Road, Pune - 411045, Maharashtra',
    );
    expect(l.notes).toBe('GSTIN: 27ABCDE1234F1Z5');
  });

  it('does not take a contact label as a name', () => {
    const l = extract(['Orbit Industries', 'Contact : 98765 43210']).lead;
    expect(l.name).toBe('');
    expect(l.mobile).toBe('+91 98765 43210');
  });

  it('handles OCR spaces around @ and icons', () => {
    const l = extract([
      'Kiran Rao',
      '☎ 98200 54321',
      '✉ kiran @ rao-associates.com',
    ]).lead;
    expect(l.email).toBe('kiran@rao-associates.com');
    expect(l.mobile).toBe('+91 98200 54321');
    expect(l.name).toBe('Kiran Rao');
  });

  it('keeps every line in rawText', () => {
    expect(extract(['Asha Patel', '  ', 'Tagline we love']).lead.rawText).toBe(
      'Asha Patel\nTagline we love',
    );
  });

  it('normalizes phones to E.164', () => {
    expect(normalizePhone('098200 12345', 'IN')).toBe('+919820012345');
    expect(normalizePhone('+91 98200-12345', 'IN')).toBe('+919820012345');
    expect(normalizePhone('12345', 'IN')).toBeNull();
  });
});

describe('accuracy helpers (AccuracyHelpersTest)', () => {
  it('checks tax ID formats', () => {
    expect(isValidGstin('27AAPFU0939F1ZV')).toBe(true);
    expect(isValidGstin('27AAPFU0939F1ZX')).toBe(false); // wrong check character
    expect(isValidGstin('27AAPFU0939F1Z')).toBe(false); // too short
    expect(isValidGstin('99AAPFU0939F1ZV')).toBe(false); // no such state
    expect(allValid('GSTIN: 27AAPFU0939F1ZV')).toBe(true);
    expect(isValidPan('ABCPM1234D')).toBe(true);
    expect(isValidPan('ABCPM12340')).toBe(false);
    expect(isValidCin('U65990DL2015PTC123456')).toBe(true);
  });

  it('flags a misread GSTIN without changing it', () => {
    const r = new RuleBasedExtractor('IN').extract([
      {text: 'Asha Patel'},
      {text: 'GSTIN: 27AAPFU0939F1ZX'},
    ]);
    expect(r.lead.notes).toBe('GSTIN: 27AAPFU0939F1ZX');
    expect(r.uncertain.has('notes')).toBe(true);
  });

  it('explains its choices', () => {
    const r = new RuleBasedExtractor('IN').extract(
      [
        'Asha Patel',
        'Sales Director',
        'Nimbus Pvt Ltd',
        'M: 98200 12345',
        'asha.patel@nimbus.in',
        'Pune 411001',
      ].map((text) => ({text})),
    );
    expect(r.reasons.name).toBe('Matches the email address');
    expect(r.reasons.jobTitle).toBe('Job title word "director"');
    expect(r.reasons.company).toBe('Matches the email / website domain');
    expect(r.reasons.mobile).toBe('Labelled on the card');
    expect(r.reasons.address).toBe('Has a PIN / ZIP code');
  });

  it('flags text OCR found hard to read', () => {
    const r = new RuleBasedExtractor('IN').extract([
      {text: 'Asha Patel', confidence: 0.4},
      {text: 'asha@nimbus.in'},
      {text: '98200 12345'},
    ]);
    expect(r.lead.name).toBe('Asha Patel');
    expect(r.uncertain.has('name')).toBe(true);
    expect(r.reasons.name).toBe('Text was hard to read');
  });

  it('uses the low-confidence threshold parameter', () => {
    const lines = [
      {text: 'Asha Patel', confidence: 0.5},
      {text: 'asha@nimbus.in'},
      {text: '98200 12345'},
    ];
    expect(
      new RuleBasedExtractor('IN', 0.4).extract(lines).uncertain.has('name'),
    ).toBe(false);
    expect(
      new RuleBasedExtractor('IN', 0.6).extract(lines).uncertain.has('name'),
    ).toBe(true);
  });

  it('keeps a phone extension separately', () => {
    const l = new RuleBasedExtractor('IN').extract([
      {text: 'Tel: 011-2345 6789 Extn. 21'},
    ]).lead;
    expect(l.officePhone).toBe('+91 11 2345 6789');
    expect(l.notes).toBe('Phone extension: 21');
  });

  it('uses columns to decide what is next to the title', () => {
    // The name sits in the left column under the title; a person-like line in the right column must not win.
    const r = new RuleBasedExtractor('IN').extract([
      {
        text: 'Senior Architect',
        height: 22,
        box: {left: 40, top: 60, right: 300, bottom: 82},
      },
      {
        text: 'Meera Nair',
        height: 30,
        box: {left: 40, top: 90, right: 300, bottom: 120},
      },
      {
        text: 'Ravi Menon',
        height: 30,
        box: {left: 600, top: 60, right: 900, bottom: 90},
      }, // e.g. a second contact on the right
      {
        text: '+91 98470 33221',
        height: 20,
        box: {left: 600, top: 100, right: 900, bottom: 120},
      },
    ]);
    expect(r.lead.name).toBe('Meera Nair');
  });
});
