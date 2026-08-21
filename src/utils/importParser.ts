// Parses text pasted directly from a Google Sheets range (Name, Date, Amount columns)
// into structured rows ready for bulk transaction import. Handles both tab-separated
// (the format Sheets/Excel produce when you copy a cell range and paste elsewhere) and,
// as a fallback, comma-separated input.

export interface ParsedImportRow {
  name: string;
  date: string; // normalized to YYYY-MM-DD
  amount: number;
}

export interface ParsedImportResult {
  rows: ParsedImportRow[];
  errors: string[]; // human-readable, one per skipped line
}

// Builds a YYYY-MM-DD string from a Date's LOCAL components (not toISOString/UTC),
// so a date like "15 Mar 2024" doesn't shift to the 14th for users in timezones ahead
// of UTC (e.g. Pakistan, UTC+5) when the browser parses it as local midnight.
const toLocalISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Strips currency symbols/labels and thousands separators, e.g. "Rs 1,200" -> 1200
const parseAmount = (raw: string): number | null => {
  const cleaned = raw.replace(/rs\.?/gi, '').replace(/pkr/gi, '').replace(/[,\s]/g, '').trim();
  if (!cleaned) return null;
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
};

const parseDate = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return null;
  return toLocalISODate(d);
};

// Splits a single line into [name, date, amount]. Tries tab-separated first (what
// Sheets/Excel produce on copy-paste), then falls back to comma-separated.
const splitLine = (line: string): string[] | null => {
  let parts = line.split('\t').map(p => p.trim()).filter((_, i, arr) => arr.length > 0);
  if (parts.length === 3) return parts;

  parts = line.split(',').map(p => p.trim());
  if (parts.length === 3) return parts;

  return null;
};

export const parseImportBlock = (raw: string): ParsedImportResult => {
  const rows: ParsedImportRow[] = [];
  const errors: string[] = [];

  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Skip an optional header row, e.g. "Name  Date  Amount"
    if (idx === 0 && /name/i.test(line) && /date/i.test(line) && /amount/i.test(line)) {
      return;
    }

    const parts = splitLine(line);
    if (!parts) {
      errors.push(`Line ${lineNum}: couldn't split into Name / Date / Amount — "${line.slice(0, 40)}"`);
      return;
    }

    const [rawName, rawDate, rawAmount] = parts;
    const date = parseDate(rawDate);
    const amount = parseAmount(rawAmount);

    if (!date) {
      errors.push(`Line ${lineNum}: unrecognized date "${rawDate}"`);
      return;
    }
    if (amount === null) {
      errors.push(`Line ${lineNum}: unrecognized amount "${rawAmount}"`);
      return;
    }

    rows.push({ name: rawName || '(no name)', date, amount });
  });

  return { rows, errors };
};
