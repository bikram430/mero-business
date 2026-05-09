/**
 * Offline-first SQLite layer using Expo SQLite.
 * Sales made during load shedding are saved here instantly,
 * then synced to the server when internet returns.
 */
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function initOfflineDB() {
  db = await SQLite.openDatabaseAsync('mero_business.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS pending_transactions (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products_cache (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      barcode TEXT,
      stock_qty INTEGER,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS merchant_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      retries INTEGER DEFAULT 0
    );
  `);
}

export async function savePendingTransaction(id: string, payload: object) {
  await db.runAsync(
    'INSERT OR REPLACE INTO pending_transactions (id, payload, created_at) VALUES (?, ?, ?)',
    [id, JSON.stringify(payload), Date.now()]
  );
}

export async function getPendingTransactions() {
  return db.getAllAsync<{ id: string; payload: string; created_at: number }>(
    'SELECT * FROM pending_transactions WHERE synced = 0 ORDER BY created_at ASC'
  );
}

export async function markTransactionSynced(id: string) {
  await db.runAsync('UPDATE pending_transactions SET synced = 1 WHERE id = ?', [id]);
}

export async function cacheProducts(products: object[]) {
  for (const p of products as any[]) {
    await db.runAsync(
      'INSERT OR REPLACE INTO products_cache (id, name, price, barcode, stock_qty, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [p.id, p.name, p.price, p.barcode ?? null, p.stock_qty ?? null, Date.now()]
    );
  }
}

export async function getCachedProducts() {
  return db.getAllAsync('SELECT * FROM products_cache ORDER BY name ASC');
}

export async function saveSetting(key: string, value: string) {
  await db.runAsync('INSERT OR REPLACE INTO merchant_settings (key, value) VALUES (?, ?)', [key, value]);
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM merchant_settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function syncOfflineTransactions(): Promise<void> {
  const pending = await getPendingTransactions();
  if (pending.length === 0) return;
  const { transactionsApi } = await import('../api/client');
  for (const row of pending) {
    try {
      const payload = JSON.parse(row.payload);
      await transactionsApi.create(payload);
      await markTransactionSynced(row.id);
    } catch {
      // Will retry on next sync
    }
  }
}
