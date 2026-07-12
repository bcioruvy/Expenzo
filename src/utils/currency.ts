// Central currency formatting utility.
// All monetary values in the app should be displayed via formatCurrency()
// so that a single UserSettings.currency value controls formatting everywhere.

export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'PKR', symbol: 'Rs', label: 'PKR (Rs - Pakistani Rupee)' },
  { code: 'USD', symbol: '$', label: 'USD ($ - United States Dollar)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€ - Euro)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£ - British Pound)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥ - Japanese Yen)' },
  { code: 'CAD', symbol: '$', label: 'CAD ($ - Canadian Dollar)' },
  { code: 'AUD', symbol: '$', label: 'AUD ($ - Australian Dollar)' },
];

export const DEFAULT_CURRENCY = 'PKR';

export const getCurrencySymbol = (currencyCode: string | undefined): string => {
  const match = CURRENCY_OPTIONS.find(c => c.code === currencyCode);
  return match ? match.symbol : 'Rs';
};

/**
 * Formats a numeric amount as a currency string using the given currency code,
 * e.g. formatCurrency(1450.5, 'PKR') -> "Rs 1,450.50"
 * PKR is formatted without decimal places by convention (whole rupees),
 * matching how currency is typically displayed in Pakistan; other currencies
 * keep 2 decimal places.
 */
export const formatCurrency = (amount: number, currencyCode: string = DEFAULT_CURRENCY): string => {
  const symbol = getCurrencySymbol(currencyCode);
  const isZeroDecimal = currencyCode === 'PKR' || currencyCode === 'JPY';
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  });
  return `${symbol} ${formatted}`;
};
