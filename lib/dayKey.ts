export function getDayKey(date: Date = new Date(), startHour = 4): string {
  const d = new Date(date);
  if (d.getHours() < startHour) {
    d.setDate(d.getDate() - 1);
  }
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}
