// Web never touches SQLite (missionDb.ts uses localStorage instead), and this
// separate .web.ts file keeps expo-sqlite (and its wasm asset) out of the web bundle entirely.
export function getDb() {
  return null;
}

export function initDb() {}
