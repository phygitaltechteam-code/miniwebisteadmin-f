import {describe, expect, it} from 'vitest';
import type {Lead} from '../../types/lead';
import {
  LEAD_EXPORT_HEADERS,
  csvQuote,
  leadRow,
  leadToVCard,
  leadsToCsv,
} from './export';

// Ported from ocrLead-app FeaturesTest.kt
const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'a1',
  adminId: 'admin-1',
  createdById: null,
  capturedBy: 'Suhel',
  name: 'Dr. Asha Patel',
  jobTitle: null,
  company: 'Nimbus Pvt Ltd',
  mobile: '+91 98200 12345',
  officePhone: null,
  otherPhone: null,
  fax: null,
  email: 'asha@nimbus.in',
  email2: null,
  website: null,
  address: null,
  linkedIn: null,
  otherSocial: null,
  notes: 'Line one\nLine two',
  event: 'Pune Expo',
  status: 'INTERESTED',
  priority: 3,
  followUpAt: '2023-11-14T00:00:00.000Z',
  starred: true,
  needsReview: false,
  source: 'SCAN',
  extractionMethod: 'rules',
  rawText: null,
  imageFront: null,
  imageBack: null,
  enquiryId: null,
  scannedAt: null,
  modifiedAt: null,
  deletedAt: null,
  createdAt: '2023-11-14T10:00:00.000Z',
  updatedAt: '2023-11-14T10:00:00.000Z',
  ...over,
});

describe('csvQuote', () => {
  it('quotes and blocks formulas', () => {
    expect(csvQuote('plain')).toBe('plain');
    expect(csvQuote('a, b')).toBe('"a, b"');
    expect(csvQuote('say "hi"')).toBe('"say ""hi"""');
    expect(csvQuote('+91 98200 12345')).toBe('"\'+91 98200 12345"');
    expect(csvQuote('=HYPERLINK(1)')).toBe('"\'=HYPERLINK(1)"');
    expect(csvQuote('-5')).toBe('"\'-5"');
    expect(csvQuote('@cmd')).toBe('"\'@cmd"');
  });

  it('writes a BOM, the header and multi-line cells', () => {
    const out = leadsToCsv([lead()]);
    expect(out.startsWith('﻿Lead ID,Name')).toBe(true);
    expect(out).toContain('"Line one\nLine two"');
    expect(out.endsWith('\n')).toBe(true);
  });
});

describe('leadRow', () => {
  it('lines up with the headers and reads the follow-up day in UTC', () => {
    const row = leadRow(lead());
    expect(row).toHaveLength(LEAD_EXPORT_HEADERS.length);
    const col = (h: string) => row[LEAD_EXPORT_HEADERS.indexOf(h)];
    expect(col('Status')).toBe('Interested');
    expect(col('Priority')).toBe('High');
    expect(col('Follow-up')).toBe('2023-11-14');
    expect(col('Starred')).toBe('Yes');
    expect(col('Read by')).toBe('Offline');
    expect(col('Needs review')).toBe('No');
  });
});

describe('leadToVCard', () => {
  it('has the contact and escapes', () => {
    const card = leadToVCard(lead({company: 'Nimbus, Pvt; Ltd'}));
    expect(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true);
    expect(card).toContain('FN:Dr. Asha Patel\r\n');
    expect(card).toContain('N:Patel;Dr. Asha;;;\r\n');
    expect(card).toContain('ORG:Nimbus\\, Pvt\\; Ltd\r\n');
    expect(card).toContain('TEL;TYPE=CELL:+91 98200 12345\r\n');
    expect(card).toContain('NOTE:Line one\\nLine two\\nMet at Pune Expo\r\n');
    expect(card.endsWith('END:VCARD\r\n')).toBe(true);
  });

  it('falls back to the company, then "Lead", for the display name', () => {
    expect(leadToVCard(lead({name: null}))).toContain('FN:Nimbus Pvt Ltd\r\n');
    expect(leadToVCard(lead({name: '', company: null}))).toContain(
      'FN:Lead\r\n',
    );
  });

  it('splits other phones into separate numbers', () => {
    const card = leadToVCard(lead({otherPhone: '98200 54321, 022 2345 6789'}));
    expect(card).toContain('TEL;TYPE=VOICE:98200 54321\r\n');
    expect(card).toContain('TEL;TYPE=VOICE:022 2345 6789\r\n');
  });
});
