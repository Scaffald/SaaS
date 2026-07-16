export const calculateTotalHours = (
  entries: Array<{ start: string; end: string }>
): number => {
  return entries.reduce((total, entry) => {
    const [startHour, startMinute] = entry.start.split(":").map(Number);
    const [endHour, endMinute] = entry.end.split(":").map(Number);

    if (
      !Number.isFinite(startHour) ||
      !Number.isFinite(startMinute) ||
      !Number.isFinite(endHour) ||
      !Number.isFinite(endMinute)
    ) {
      return total;
    }

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (endMinutes <= startMinutes) {
      return total;
    }

    return total + (endMinutes - startMinutes) / 60;
  }, 0);
};
