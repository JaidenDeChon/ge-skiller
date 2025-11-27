/**
 * Formats a number with thousands separators for human-friendly display.
 */
export function formatWithCommas(value?: number | null): string {
  if (value === null || value === undefined) return '';
  return value.toLocaleString('en-US');
}

export default formatWithCommas;
