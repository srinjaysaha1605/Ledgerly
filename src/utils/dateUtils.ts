export const getLocalYearMonth = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export const getLocalDateString = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const isDateInMonth = (
  dateValue: string | Date | null | undefined,
  monthKey: string,
): boolean => {
  if (!dateValue) return false;

  const parsedDate = typeof dateValue === 'string'
    ? new Date(dateValue.includes('T') ? dateValue : `${dateValue}T12:00:00`)
    : dateValue;

  if (Number.isNaN(parsedDate.getTime())) return false;

  return getLocalYearMonth(parsedDate) === monthKey;
};
