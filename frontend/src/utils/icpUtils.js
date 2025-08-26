/**
 * Utility functions for handling ICP (Internet Computer Protocol) data formats
 */

/**
 * Converts ICP nanosecond timestamp to JavaScript Date object
 * ICP uses nat64 nanosecond timestamps, JS uses millisecond timestamps
 * @param {bigint|number|string} icpTimestamp - ICP timestamp in nanoseconds
 * @returns {Date} JavaScript Date object
 */
export function icpTimestampToDate(icpTimestamp) {
  if (!icpTimestamp) return new Date();
  
  // Convert to number and divide by 1,000,000 to get milliseconds
  const milliseconds = Number(icpTimestamp) / 1000000;
  return new Date(milliseconds);
}

/**
 * Converts ICP nanosecond timestamp to ISO string
 * @param {bigint|number|string} icpTimestamp - ICP timestamp in nanoseconds
 * @returns {string} ISO date string
 */
export function icpTimestampToISOString(icpTimestamp) {
  return icpTimestampToDate(icpTimestamp).toISOString();
}

/**
 * Converts JavaScript Date to ICP nanosecond timestamp
 * @param {Date} date - JavaScript Date object
 * @returns {bigint} ICP timestamp in nanoseconds
 */
export function dateToIcpTimestamp(date = new Date()) {
  return BigInt(date.getTime() * 1000000);
}

/**
 * Formats ICP timestamp for display
 * @param {bigint|number|string} icpTimestamp - ICP timestamp in nanoseconds
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatIcpTimestamp(icpTimestamp, options = {}) {
  const date = icpTimestampToDate(icpTimestamp);
  const defaultOptions = {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
}

/**
 * Checks if an ICP timestamp is valid (not zero or null)
 * @param {bigint|number|string} icpTimestamp - ICP timestamp in nanoseconds
 * @returns {boolean} True if valid timestamp
 */
export function isValidIcpTimestamp(icpTimestamp) {
  return icpTimestamp && Number(icpTimestamp) > 0;
}
