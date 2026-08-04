export type ViewMode = 'day' | 'week' | 'month';

/** Formats a Date using its LOCAL calendar fields (never round-trips through UTC). */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function offsetDate(date: string, delta: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

export function offsetMonth(date: string, delta: number): string {
  const d = new Date(date + 'T00:00:00');
  const targetMonth = d.getMonth() + delta;
  d.setMonth(targetMonth);
  // Clamp to month end if overflow (e.g. Jan 31 + 1 month → Feb 28)
  if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    d.setDate(0);
  }
  return toDateStr(d);
}

export function getMonthFirst(date: string): string {
  return date.slice(0, 7) + '-01';
}

/** Returns `count` consecutive dates starting at date (rolling window, not week-aligned) */
export function getDateRange(date: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => offsetDate(date, i));
}

/** Returns 42 calendar grid cells for the month containing date */
export function getCalendarDates(date: string): { date: string; isCurrentMonth: boolean }[] {
  const d = new Date(date + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1);

  let startDow = firstDay.getDay(); // 0=Sun
  if (startDow === 0) startDow = 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(1 - (startDow - 1));

  return Array.from({ length: 42 }, (_, i) => {
    const cell = new Date(gridStart);
    cell.setDate(gridStart.getDate() + i);
    return {
      date: toDateStr(cell),
      isCurrentMonth: cell.getMonth() === month,
    };
  });
}

export function labelDay(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });
}

export function labelWeek(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export function labelMonth(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

/** Mon=0 .. Sun=6, matching DOW_LABELS order (unlike Date#getDay's Sun=0) */
export function dowIndex(date: string): number {
  return (new Date(date + 'T00:00:00').getDay() + 6) % 7;
}

export function labelFullDate(date: string): string {
  const d = new Date(date + 'T00:00:00');
  const dow = DOW_LABELS[dowIndex(date)];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`;
}

export function labelShortDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  });
}

export const DOW_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
