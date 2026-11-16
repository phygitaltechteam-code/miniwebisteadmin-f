// Lead exports (CSV, Excel, vCard), ported from the Android app's export/LeadColumns.kt,
// TextExporters.kt and XlsxExporter.kt. Excel is built with exceljs, loaded only when used.
import {
  LEAD_FIELDS,
  LEAD_SOURCES,
  LEAD_STATUSES,
  type Lead,
} from '../../types/lead';
import {formatDateTime, utcDay} from './dates';

export const LEAD_EXPORT_HEADERS: string[] = [
  'Lead ID',
  ...LEAD_FIELDS.map((f) => f.label),
  'Event',
  'Status',
  'Priority',
  'Follow-up',
  'Starred',
  'Source',
  'Captured by',
  'Scan date',
  'Card image',
  'Read by',
  'Needs review',
  'Raw OCR text',
];

const PRIORITY_LABELS = ['', 'Low', 'Medium', 'High'];

const readBy = (method?: string | null): string => {
  switch ((method ?? '').toLowerCase()) {
    case 'gemini':
      return 'AI';
    case 'rules':
    case 'ocr':
    case 'tesseract':
      return 'Offline';
    case 'qr':
      return 'QR code';
    case 'text':
      return 'Pasted text';
    default:
      return 'Manual';
  }
};

const s = (v?: string | null) => v ?? '';

/** One export row, in [LEAD_EXPORT_HEADERS] order. */
export const leadRow = (lead: Lead): string[] => [
  lead.id,
  ...LEAD_FIELDS.map((f) => s(lead[f.key])),
  s(lead.event),
  LEAD_STATUSES.find((x) => x.value === lead.status)?.label ?? s(lead.status),
  PRIORITY_LABELS[lead.priority] ?? '',
  utcDay(lead.followUpAt),
  lead.starred ? 'Yes' : '',
  LEAD_SOURCES.find((x) => x.value === lead.source)?.label ?? s(lead.source),
  s(lead.capturedBy),
  formatDateTime(lead.scannedAt || lead.createdAt),
  [lead.imageFront, lead.imageBack].filter(Boolean).join(', '),
  readBy(lead.extractionMethod),
  lead.needsReview ? 'Yes' : 'No',
  s(lead.rawText),
];

/** RFC 4180: quote when needed, double inner quotes. A leading = + - @ is prefixed with ' so Excel can't run it as a formula. */
export const csvQuote = (value: string): string => {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[,"\n\r]/.test(safe) || safe !== value
    ? `"${safe.replace(/"/g, '""')}"`
    : safe;
};

/** CSV text starting with a UTF-8 BOM so Excel shows Hindi and ₹ correctly. */
export const leadsToCsv = (leads: Lead[]): string =>
  '﻿' +
  [LEAD_EXPORT_HEADERS, ...leads.map(leadRow)]
    .map((row) => row.map(csvQuote).join(',') + '\n')
    .join('');

const vEsc = (v: string) =>
  v
    .trim()
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n');

/** vCard 3.0 for one lead: imports into Google Contacts, iPhone, Outlook and most CRMs. */
export const leadToVCard = (lead: Partial<Lead>): string => {
  const out: string[] = [];
  const line = (x: string) => out.push(`${x}\r\n`);
  const name = s(lead.name);
  const company = s(lead.company);
  line('BEGIN:VCARD');
  line('VERSION:3.0');
  line(`FN:${vEsc(name.trim() || company.trim() || 'Lead')}`);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const family = parts.length > 1 ? parts[parts.length - 1] : '';
  const given =
    parts.length > 1 ? parts.slice(0, -1).join(' ') : (parts[0] ?? '');
  line(`N:${vEsc(family)};${vEsc(given)};;;`);
  if (company.trim()) line(`ORG:${vEsc(company)}`);
  if (s(lead.jobTitle).trim()) line(`TITLE:${vEsc(s(lead.jobTitle))}`);
  if (s(lead.mobile).trim()) line(`TEL;TYPE=CELL:${vEsc(s(lead.mobile))}`);
  if (s(lead.officePhone).trim())
    line(`TEL;TYPE=WORK:${vEsc(s(lead.officePhone))}`);
  s(lead.otherPhone)
    .split(',')
    .filter((p) => p.trim())
    .forEach((p) => line(`TEL;TYPE=VOICE:${vEsc(p.trim())}`));
  if (s(lead.fax).trim()) line(`TEL;TYPE=FAX:${vEsc(s(lead.fax))}`);
  [s(lead.email), s(lead.email2)]
    .filter((e) => e.trim())
    .forEach((e) => line(`EMAIL;TYPE=INTERNET:${vEsc(e)}`));
  [s(lead.website), s(lead.linkedIn)]
    .filter((u) => u.trim())
    .forEach((u) => line(`URL:${vEsc(u)}`));
  if (s(lead.address).trim())
    line(`ADR;TYPE=WORK:;;${vEsc(s(lead.address))};;;;`);
  const event = s(lead.event).trim();
  const note = [s(lead.notes), event ? `Met at ${event}` : '']
    .filter((n) => n.trim())
    .join('\n');
  if (note.trim()) line(`NOTE:${vEsc(note)}`);
  line('END:VCARD');
  return out.join('');
};

export const leadsToVCard = (leads: Lead[]): string =>
  leads.map(leadToVCard).join('');

/** Builds the .xlsx: one "Leads" sheet, bold frozen header, every cell as text (keeps "+91" phones intact). */
export const leadsToXlsx = async (leads: Lead[]): Promise<Blob> => {
  // exceljs is CommonJS: depending on the bundler its API is the module itself or its default export
  const mod = (await import('exceljs')) as typeof import('exceljs') & {
    default?: typeof import('exceljs');
  };
  const ExcelJS = mod.default ?? mod;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Leads';
  const sheet = workbook.addWorksheet('Leads', {
    views: [{state: 'frozen', ySplit: 1}],
  });
  const rows = leads.map(leadRow);
  sheet.addRow(LEAD_EXPORT_HEADERS);
  rows.forEach((r) => sheet.addRow(r));
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.numFmt = '@';
    });
  });
  const header = sheet.getRow(1);
  header.font = {bold: true};
  header.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {argb: 'FFDCE3FF'},
    };
  });
  LEAD_EXPORT_HEADERS.forEach((h, c) => {
    const longest = Math.max(
      ...[h, ...rows.map((r) => r[c])].map((v) =>
        Math.max(0, ...v.split(/\r\n|\n|\r/).map((l) => l.length)),
      ),
    );
    sheet.getColumn(c + 1).width = Math.min(50, Math.max(8, longest + 2));
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export type LeadExportFormat = 'csv' | 'xlsx' | 'vcf';

export const exportLeads = async (
  leads: Lead[],
  format: LeadExportFormat,
  baseName = 'leads',
) => {
  if (format === 'csv') {
    downloadBlob(
      new Blob([leadsToCsv(leads)], {type: 'text/csv;charset=utf-8'}),
      `${baseName}.csv`,
    );
  } else if (format === 'vcf') {
    downloadBlob(
      new Blob([leadsToVCard(leads)], {type: 'text/vcard;charset=utf-8'}),
      `${baseName}.vcf`,
    );
  } else {
    downloadBlob(await leadsToXlsx(leads), `${baseName}.xlsx`);
  }
};
