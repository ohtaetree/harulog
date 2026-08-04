import { Platform } from 'react-native';

let db: any = null;

export function getDb() {
  if (Platform.OS === 'web') return null;
  if (!db) {
    const SQLite = require('expo-sqlite');
    db = SQLite.openDatabaseSync('harulog.db');
  }
  return db;
}

export function initDb() {
  if (Platform.OS === 'web') return;
  const database = getDb();
  database.execSync(`
    CREATE TABLE IF NOT EXISTS missions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT    NOT NULL,
      title       TEXT    NOT NULL,
      priority    TEXT    NOT NULL DEFAULT 'medium',
      category    TEXT    NOT NULL DEFAULT '',
      done        INTEGER NOT NULL DEFAULT 0,
      created_at  INTEGER NOT NULL DEFAULT 0,
      start_time  TEXT,
      end_time    TEXT
    );
  `);
  // migration: add category column if missing (older installs)
  try { database.execSync("ALTER TABLE missions ADD COLUMN category TEXT NOT NULL DEFAULT ''"); } catch {}
  // migration: add start_time/end_time columns if missing (older installs)
  try { database.execSync("ALTER TABLE missions ADD COLUMN start_time TEXT"); } catch {}
  try { database.execSync("ALTER TABLE missions ADD COLUMN end_time TEXT"); } catch {}
}
