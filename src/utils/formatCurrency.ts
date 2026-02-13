export function formatCurrency(value: number, currency: string = 'USD') {
  if (currency === 'USDT') {
    return value.toLocaleString(undefined, { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT';
  }
  if (currency === 'BTC') {
    return value.toLocaleString(undefined, { style: 'decimal', minimumFractionDigits: 6, maximumFractionDigits: 6 }) + ' BTC';
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // fallback for unsupported currencies
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;
  }
} 