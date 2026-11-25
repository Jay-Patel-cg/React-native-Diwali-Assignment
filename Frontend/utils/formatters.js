/**
 * Formatting helpers for currency, dates, and travel progress indicators.
 */

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  THB: '฿',
};

export const formatCurrency = (amount = 0, currency = 'INR') => {
  const numeric = Number(amount);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  const code = String(currency || 'INR').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] || `${code} `;

  const formatted = safeValue.toLocaleString('en-IN', {
    minimumFractionDigits: safeValue % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formatted}`;
};

export const formatShortDate = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDate = (dateInput, fallback = '') =>
  formatShortDate(dateInput) || fallback;

export const formatDateRange = (startDate, endDate) => {
  const start = formatShortDate(startDate);
  const end = formatShortDate(endDate);
  if (start && end) return `${start} – ${end}`;
  return start || end || 'Dates TBD';
};

export const formatTitleCase = (str = '') =>
  String(str)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default {
  formatCurrency,
  formatShortDate,
  formatDate,
  formatDateRange,
  formatTitleCase,
};

