/**
 * Number and currency formatting utilities supporting Bengali & English.
 */

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Converts English digits (0-9) to Bengali digits (০-৯)
 * @param {number|string} input 
 * @returns {string}
 */
export function toBengaliNumerals(input) {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

/**
 * Formats a currency number with Bangladeshi Taka (৳) symbol and grouping.
 * @param {number} amount 
 * @param {'bn'|'en'} language 
 * @returns {string} e.g. "৳ ১৮,৪৫০" or "৳ 18,450"
 */
export function formatCurrency(amount, language = 'bn') {
  if (typeof amount !== 'number') {
    amount = Number(amount) || 0;
  }

  // Format with standard thousands separator
  const formattedEn = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount);

  if (language === 'bn') {
    return `৳ ${toBengaliNumerals(formattedEn)}`;
  }
  return `৳ ${formattedEn}`;
}

/**
 * Formats a plain number with locale-appropriate numerals
 * @param {number|string} num 
 * @param {'bn'|'en'} language 
 * @returns {string}
 */
export function formatNumber(num, language = 'bn') {
  if (num === null || num === undefined) return '';
  const numStr = String(num);
  if (language === 'bn') {
    return toBengaliNumerals(numStr);
  }
  return numStr;
}

/**
 * Formats a standard time string
 * @param {string} timeStr e.g. "11:30 AM"
 * @param {'bn'|'en'} language 
 * @returns {string}
 */
export function formatTime(timeStr, language = 'bn') {
  if (!timeStr) return '';
  if (language === 'bn') {
    return toBengaliNumerals(timeStr)
      .replace(/AM/g, 'সকাল')
      .replace(/PM/g, 'বিকাল');
  }
  return timeStr;
}
