// Parses text pasted directly from a Google Sheets range (Name, Date, Amount columns) into
// structured rows ready for bulk transaction import.
//
// Rather than splitting on a delimiter (tabs/commas/spaces), which breaks down when the
// pasted spacing between columns is inconsistent (e.g. an iPad copy that sometimes yields a
// single space instead of a tab), this works by ANCHOR EXTRACTION on each line:
//   1. Strip the amount from the very end of the line (it's always the trailing number).
//   2. Find a date-like substring anywhere in what's left and pull it out.
//   3. Whatever remains is the name — regardless of whether the date came before or after
//      the name in the original column order.
// This makes parsing robust to column order, extra spacing, and mixed separators.

export interface ParsedImportRow {
  name: string;
  date: string; // normalized to YYYY-MM-DD
  amount: number;
}

export interface ParsedImportResult {
  rows: ParsedImportRow[];
  errors: string[]; // human-readable, one per skipped line
}

// Matches a trailing amount at the end of a line, e.g. "1,235", "810", "950.50"
const AMOUNT_TRAIL_RE = /([\d][\d,]*\.?\d*)\s*$/;

// Matches common written-out / numeric date formats, e.g. "16 Feb", "16 Feb 2024",
// "March 15, 2024", "Mar 15 2024", "2024-03-15", "16/03/2024"
const DATE_RE = /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{0,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s*\d{0,4}|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;

const toLocalISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Strips currency symbols/labels and thousands separators, e.g. "Rs 1,200" -> 1200.
// Returns null if the cleaned string isn't purely numeric.
const tryParseAmount = (field: string): number | null => {
  const cleaned = field.replace(/rs\.?/gi, '').replace(/pkr/gi, '').replace(/[,\s]/g, '').trim();
  if (!cleaned || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
};

// Parses a date substring. If it has no 4-digit year (e.g. "16 Feb"), infers the year as
// the current year — unless that would put the date in the future, in which case it rolls
// back one year. This matters because a "previous months" sheet with no year on each row
// would otherwise default to the (wrong) year 2001, a quirk of JS's Date parser.
const tryParseDate = (field: string): string | null => {
  const trimmed = field.trim();
  if (!trimmed) return null;
  const hasYear = /\d{4}/.test(trimmed);
  let d = new Date(trimmed);
  if (isNaN(d.getTime())) return null;

  if (!hasYear) {
    const now = new Date();
    d = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    if (d.getTime() > now.getTime()) {
      d = new Date(now.getFullYear() - 1, d.getMonth(), d.getDate());
    }
  }

  return toLocalISODate(d);
};

interface ParsedLine {
  name: string;
  date: string;
  amount: number;
}

const parseLine = (line: string): ParsedLine | { error: string } => {
  const trimmedLine = line.trim();

  const amountMatch = AMOUNT_TRAIL_RE.exec(trimmedLine);
  if (!amountMatch) {
    return { error: `no amount found at the end of the line — "${trimmedLine.slice(0, 40)}"` };
  }
  const amount = tryParseAmount(amountMatch[1]);
  if (amount === null) {
    return { error: `unrecognized amount "${amountMatch[1]}"` };
  }

  const rest = trimmedLine.slice(0, amountMatch.index).trim();

  const dateMatch = DATE_RE.exec(rest);
  if (!dateMatch) {
    return { error: `no date found — "${rest.slice(0, 40)}"` };
  }
  const date = tryParseDate(dateMatch[0]);
  if (!date) {
    return { error: `unrecognized date "${dateMatch[0]}"` };
  }

  const name = (
    rest.slice(0, dateMatch.index) + ' ' + rest.slice(dateMatch.index + dateMatch[0].length)
  )
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .trim();

  return { name: name || '(no name)', date, amount };
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

    const parsed = parseLine(line);
    if ('error' in parsed) {
      errors.push(`Line ${lineNum}: ${parsed.error}`);
      return;
    }

    rows.push(parsed);
  });

  return { rows, errors };
};
