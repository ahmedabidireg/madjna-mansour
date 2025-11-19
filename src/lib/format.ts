export const formatCurrencyTND = (value: number): string => {
  try {
    const formatted = new Intl.NumberFormat('ar-TN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
    return `${formatted} د`;
  } catch {
    return `${(value || 0).toFixed(2)} د`;
  }
};

