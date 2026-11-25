/**
 * Client-side input validation helpers aligned with backend validation rules.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (email = '') => EMAIL_REGEX.test(String(email).trim());

export const isValidPassword = (password = '') =>
  typeof password === 'string' && password.length >= 6;

export const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return end >= start;
};

export const isPositiveAmount = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
};

export default {
  isValidEmail,
  isValidPassword,
  isValidDateRange,
  isPositiveAmount,
};

