// Follow-up dates are date-only values: the server stores them as UTC midnight and the UI
// sends/shows 'YYYY-MM-DD'. Always read the UTC date part so no time zone shifts the day.

/** 'YYYY-MM-DD' of an ISO timestamp's UTC date, or '' when missing/invalid. */
export const utcDay = (value?: string | null): string => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date on this device, as 'YYYY-MM-DD'. */
export const localToday = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** '2026-11-06' -> '6 Nov 2026'. */
export const formatDay = (day: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return day;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
};

/** Local 'YYYY-MM-DD HH:mm' of a timestamp, or ''. */
export const formatDateTime = (value?: string | null): string => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${localToday(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
