/**
 * Format paise to INR display with Indian numbering system
 */
export function formatPaiseToRupees(paise: number, showDecimals = false): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees);
}

/**
 * Format price range from paise
 */
export function formatPriceRange(lowPaise: number, highPaise: number, unit = 'kg'): string {
  const low = Math.round(lowPaise / 100);
  const high = Math.round(highPaise / 100);
  if (low === high) {
    return `₹${low}/${unit}`;
  }
  return `₹${low} – ₹${high}/${unit}`;
}

/**
 * Format kg weight
 */
export function formatKg(kg: number): string {
  const rounded = Math.round(kg * 10) / 10;
  return `${rounded.toLocaleString('en-IN')} kg`;
}

/**
 * Format relative time or time of day
 */
export function formatTimeOnly(isoOrTimeString: string): string {
  if (!isoOrTimeString) return '';
  if (isoOrTimeString.length === 5 && isoOrTimeString.includes(':')) {
    // Already "06:30"
    return isoOrTimeString;
  }
  try {
    const d = new Date(isoOrTimeString);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoOrTimeString;
  }
}

/**
 * Format date in Indian style (DD MMM YYYY)
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}
