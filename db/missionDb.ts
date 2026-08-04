import { Platform } from 'react-native';
import { getDb } from './database';

export type Priority = 'high' | 'medium' | 'low';

export interface MissionRow {
  id: number;
  date: string;
  title: string;
  priority: Priority;
  category: string;
  done: number;
  created_at: number;
  start_time: string | null;
  end_time: string | null;
}

// ── Web: localStorage ────────────────────────────────────────────────────────

function webKey(date: string) { return `harulog_missions_${date}`; }

function webGetAll(date: string): MissionRow[] {
  try {
    const rows: Partial<MissionRow>[] = JSON.parse(localStorage.getItem(webKey(date)) ?? '[]');
    return rows.map((r) => ({ start_time: null, end_time: null, ...r } as MissionRow));
  }
  catch { return []; }
}

function webSaveAll(date: string, rows: MissionRow[]) {
  localStorage.setItem(webKey(date), JSON.stringify(rows));
}

// ── Native: SQLite ───────────────────────────────────────────────────────────

function nativeGetAll(date: string): MissionRow[] {
  return (getDb()?.getAllSync(
    'SELECT * FROM missions WHERE date = ? ORDER BY priority DESC, created_at ASC', [date]
  ) ?? []) as MissionRow[];
}

// ── Exports ──────────────────────────────────────────────────────────────────

export function getMissions(date: string): MissionRow[] {
  return Platform.OS === 'web' ? webGetAll(date) : nativeGetAll(date);
}

export function addMission(
  date: string, title: string, priority: Priority, category: string,
  startTime: string | null = null, endTime: string | null = null,
): number {
  const now = Date.now();
  if (Platform.OS === 'web') {
    const rows = webGetAll(date);
    const id = now;
    rows.push({ id, date, title, priority, category, done: 0, created_at: id, start_time: startTime, end_time: endTime });
    webSaveAll(date, rows);
    return id;
  }
  const result = getDb()?.runSync(
    'INSERT INTO missions (date, title, priority, category, done, created_at, start_time, end_time) VALUES (?,?,?,?,0,?,?,?)',
    [date, title, priority, category, now, startTime, endTime]
  );
  return result?.lastInsertRowId ?? 0;
}

export function toggleMission(id: number, done: boolean) {
  if (Platform.OS === 'web') {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('harulog_missions_')) continue;
      const rows: MissionRow[] = JSON.parse(localStorage.getItem(key) ?? '[]');
      const idx = rows.findIndex((r) => r.id === id);
      if (idx !== -1) { rows[idx].done = done ? 1 : 0; localStorage.setItem(key, JSON.stringify(rows)); return; }
    }
    return;
  }
  getDb()?.runSync('UPDATE missions SET done = ? WHERE id = ?', [done ? 1 : 0, id]);
}

export function deleteMission(id: number) {
  if (Platform.OS === 'web') {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('harulog_missions_')) continue;
      const rows: MissionRow[] = JSON.parse(localStorage.getItem(key) ?? '[]');
      const filtered = rows.filter((r) => r.id !== id);
      if (filtered.length !== rows.length) { localStorage.setItem(key, JSON.stringify(filtered)); return; }
    }
    return;
  }
  getDb()?.runSync('DELETE FROM missions WHERE id = ?', [id]);
}

export function updateMission(
  id: number, title: string, priority: Priority, category: string,
  startTime: string | null = null, endTime: string | null = null,
  date?: string,
) {
  if (Platform.OS === 'web') {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('harulog_missions_')) continue;
      const rows: MissionRow[] = JSON.parse(localStorage.getItem(key) ?? '[]');
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) continue;

      const row = rows[idx];
      row.title = title; row.priority = priority; row.category = category;
      row.start_time = startTime; row.end_time = endTime;

      if (date && date !== row.date) {
        rows.splice(idx, 1);
        localStorage.setItem(key, JSON.stringify(rows));
        row.date = date;
        const destRows = webGetAll(date);
        destRows.push(row);
        webSaveAll(date, destRows);
      } else {
        localStorage.setItem(key, JSON.stringify(rows));
      }
      return;
    }
    return;
  }
  if (date) {
    getDb()?.runSync(
      'UPDATE missions SET title=?, priority=?, category=?, start_time=?, end_time=?, date=? WHERE id=?',
      [title, priority, category, startTime, endTime, date, id]
    );
  } else {
    getDb()?.runSync(
      'UPDATE missions SET title=?, priority=?, category=?, start_time=?, end_time=? WHERE id=?',
      [title, priority, category, startTime, endTime, id]
    );
  }
}
