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
//
// Dates are parsed with a hand-written day/month/year parser rather than `new Date(string)`.
// The JS spec only guarantees consistent behavior for the strict ISO format (YYYY-MM-DD) —
// everything else (e.g. "16 Feb") is implementation-defined, and Safari/WebKit (iPad) parses
// such strings differently than other engines. Hand-parsing avoids that inconsistency.

export interface ParsedImportRow {
  name: string;
  date: string; // normalized to YYYY-MM-DD
  amount: number;
}

export interface ParsedImportResult {
  rows: ParsedImportRow[];
  errors: string[]; // human-readable, one per skipped line
}

const MONTH_NAMES: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Matches a trailing amount at the end of a line, e.g. "1,235", "810", "950.50"
const AMOUNT_TRAIL_RE = /([\d][\d,]*\.?\d*)\s*$/;

// Locates a date-like substring anywhere within a line: "16 Feb", "16 Feb 2024",
// "March 15, 2024", "Mar 15 2024", "2024-03-15", "16/03/2024". Global flag so every
// candidate in the line can be tried, not just the first (a name word followed by a
// number, e.g. "Store 16", can otherwise look date-shaped before the real date is reached).
const DATE_TOKEN_RE = /(\d{1,2}\s+[a-zA-Z]{3,9}\.?\s*\d{0,4}|[a-zA-Z]{3,9}\.?\s+\d{1,2},?\s*\d{0,4}|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g;

const toLocalISODate = (y: number, monthIndex: number, day: number): string => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Strips currency symbols/labels and thousands separators, e.g. "Rs 1,200" -> 1200.
// Returns null if the cleaned string isn't purely numeric.
const tryParseAmount = (field: string): number | null => {
  const cleaned = field.replace(/rs\.?/gi, '').replace(/pkr/gi, '').replace(/[,\s]/g, '').trim();
  if (!cleaned || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
};

// Resolves a possibly-missing year into a concrete 4-digit year, given a known
// month/day. With no year given (common for "this year's" sheet rows), defaults to
// the current year — unless that would place the date in the future, in which case
// it rolls back one year (so "16 Feb" pasted in August correctly means this Feb, not
// next Feb, and "22 Aug" pasted a day early correctly means last Aug).
const resolveYear = (rawYear: string | undefined, monthIndex: number, day: number): number => {
  if (rawYear) {
    const y = parseInt(rawYear, 10);
    return rawYear.length === 2 ? 2000 + y : y;
  }
  const now = new Date();
  const candidateThisYear = new Date(now.getFullYear(), monthIndex, day);
  if (candidateThisYear.getTime() > now.getTime()) {
    return now.getFullYear() - 1;
  }
  return now.getFullYear();
};

// Hand-parses a date token (already located by DATE_TOKEN_RE) into YYYY-MM-DD.
// Returns null if the token isn't actually a valid date (e.g. bad month name, or a
// day that overflows its month, like "31 Feb").
const parseDateToken = (token: string): string | null => {
  const t = token.trim();

  // ISO: YYYY-MM-DD
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (m) {
    const [, yStr, moStr, dStr] = m;
    const monthIndex = parseInt(moStr, 10) - 1;
    const day = parseInt(dStr, 10);
    if (monthIndex < 0 || monthIndex > 11) return null;
    const d = new Date(parseInt(yStr, 10), monthIndex, day);
    if (d.getMonth() !== monthIndex) return null; // overflowed (e.g. day 31 in a 30-day month)
    return toLocalISODate(parseInt(yStr, 10), monthIndex, day);
  }

  // Numeric slash/dash: DD/MM/YYYY (day-first, matching local convention)
  m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(t);
  if (m) {
    const [, dStr, moStr, yStr] = m;
    const monthIndex = parseInt(moStr, 10) - 1;
    const day = parseInt(dStr, 10);
    if (monthIndex < 0 || monthIndex > 11) return null;
    const year = yStr.length === 2 ? 2000 + parseInt(yStr, 10) : parseInt(yStr, 10);
    const d = new Date(year, monthIndex, day);
    if (d.getMonth() !== monthIndex) return null;
    return toLocalISODate(year, monthIndex, day);
  }

  // "16 Feb" / "16 Feb 2024" / "16 February 2024"
  m = /^(\d{1,2})\s+([a-zA-Z]{3,9})\.?\s*(\d{2,4})?$/.exec(t);
  if (m) {
    const [, dStr, monthName, yStr] = m;
    const monthIndex = MONTH_NAMES[monthName.slice(0, 3).toLowerCase()];
    if (monthIndex === undefined) return null;
    const day = parseInt(dStr, 10);
    const year = resolveYear(yStr, monthIndex, day);
    const d = new Date(year, monthIndex, day);
    if (d.getMonth() !== monthIndex) return null;
    return toLocalISODate(year, monthIndex, day);
  }

  // "Feb 16" / "Feb 16, 2024" / "February 16 2024"
  m = /^([a-zA-Z]{3,9})\.?\s+(\d{1,2}),?\s*(\d{2,4})?$/.exec(t);
  if (m) {
    const [, monthName, dStr, yStr] = m;
    const monthIndex = MONTH_NAMES[monthName.slice(0, 3).toLowerCase()];
    if (monthIndex === undefined) return null;
    const day = parseInt(dStr, 10);
    const year = resolveYear(yStr, monthIndex, day);
    const d = new Date(year, monthIndex, day);
    if (d.getMonth() !== monthIndex) return null;
    return toLocalISODate(year, monthIndex, day);
  }

  return null;
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

  // Try every date-shaped candidate in the line, left to right, and use the first one
  // that's actually a valid date — not just the first one that superficially looks like
  // one (a name word followed by a number can otherwise be mistaken for a date token).
  DATE_TOKEN_RE.lastIndex = 0;
  let dateMatch: RegExpExecArray | null;
  let date: string | null = null;
  let matchedToken: RegExpExecArray | null = null;
  while ((dateMatch = DATE_TOKEN_RE.exec(rest)) !== null) {
    const candidate = parseDateToken(dateMatch[0]);
    if (candidate) {
      date = candidate;
      matchedToken = dateMatch;
      break;
    }
  }

  if (!date || !matchedToken) {
    return { error: `no valid date found — "${rest.slice(0, 40)}"` };
  }

  const name = (
    rest.slice(0, matchedToken.index) + ' ' + rest.slice(matchedToken.index + matchedToken[0].length)
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
