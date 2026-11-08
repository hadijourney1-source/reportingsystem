// All dates are the school's local date (Lagos), so "today" never flips at the wrong hour.
export function todayLagos(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
}

function isoWeekday(date: string): number {
  const d = new Date(date + 'T12:00:00Z').getUTCDay();
  return d === 0 ? 7 : d;
}

export function mondayOf(date: string): string {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - (isoWeekday(date) - 1));
  return d.toISOString().slice(0, 10);
}

export function weekday(date: string): number {
  return isoWeekday(date);
}

// Daily reports are keyed by the day; weekly reports by the Monday of that week.
export function periodFor(frequency: 'daily' | 'weekly', today = todayLagos()): string {
  return frequency === 'daily' ? today : mondayOf(today);
}

export function prettyDate(date: string): string {
  return new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  });
}
