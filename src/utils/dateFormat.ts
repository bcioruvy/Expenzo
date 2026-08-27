import { format as formatDateFns } from 'date-fns';

// Converts a stored transaction/budget/goal date string (always "YYYY-MM-DD" internally,
// regardless of display preference) into whatever format the user picked in
// Settings > Preferences > Date Format. This is the ONLY place display formatting should
// happen — the stored value itself never changes, so this is purely presentational.
//
// Parses the date manually into Year/Month/Day components (rather than `new Date(dateStr)`,
// which interprets a bare "YYYY-MM-DD" string as UTC midnight) to avoid the date shifting
// by a day for users in timezones ahead of UTC, e.g. Pakistan (UTC+5).
export const formatDate = (dateStr: string | undefined | null, dateFormat: string = 'yyyy-MM-dd'): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return dateStr;
  return formatDateFns(d, dateFormat);
};
