import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), 'data', 'veckis.db')

const dir = path.dirname(DB_PATH)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

// Singleton — survives hot-reload in dev via globalThis
const g = globalThis as typeof globalThis & { __veckisDb?: Database.Database }

function getDb(): Database.Database {
  if (!g.__veckisDb) {
    g.__veckisDb = new Database(DB_PATH)
    g.__veckisDb.pragma('journal_mode = WAL')
    migrate(g.__veckisDb)
  }
  return g.__veckisDb
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      child_name TEXT NOT NULL DEFAULT 'Barnet',
      weekly_amount INTEGER NOT NULL DEFAULT 50,
      topup_day INTEGER NOT NULL DEFAULT 6,
      parent_pin_hash TEXT NOT NULL DEFAULT '',
      last_topup_date TEXT NOT NULL DEFAULT ''
    );

    INSERT OR IGNORE INTO settings (id) VALUES (1);

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount INTEGER NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'manual',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

// ── Auth ────────────────────────────────────────────────────────────────────

export function hashPin(pin: string): string {
  return crypto
    .createHash('sha256')
    .update('veckis:' + pin)
    .digest('hex')
}

export function verifyPin(pin: string): boolean {
  const s = getSettings()
  if (!s.parent_pin_hash) return false
  return hashPin(pin) === s.parent_pin_hash
}

// ── Settings ─────────────────────────────────────────────────────────────────

export interface Settings {
  id: number
  child_name: string
  weekly_amount: number
  topup_day: number
  parent_pin_hash: string
  last_topup_date: string
}

export function getSettings(): Settings {
  return getDb()
    .prepare('SELECT * FROM settings WHERE id = 1')
    .get() as Settings
}

export function updateSettings(
  data: Partial<Omit<Settings, 'id'>>
): void {
  const keys = Object.keys(data)
  if (keys.length === 0) return
  const fields = keys.map((k) => `${k} = @${k}`).join(', ')
  getDb()
    .prepare(`UPDATE settings SET ${fields} WHERE id = 1`)
    .run(data)
}

// ── Transactions ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: number
  amount: number
  description: string
  type: string
  created_at: string
}

export function getBalance(): number {
  const row = getDb()
    .prepare('SELECT COALESCE(SUM(amount), 0) AS bal FROM transactions')
    .get() as { bal: number }
  return row.bal
}

export function getTransactions(limit = 30): Transaction[] {
  return getDb()
    .prepare(
      'SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?'
    )
    .all(limit) as Transaction[]
}

export function addTransaction(
  amount: number,
  description: string,
  type = 'manual'
): Transaction {
  const stmt = getDb().prepare(
    'INSERT INTO transactions (amount, description, type) VALUES (?, ?, ?)'
  )
  const result = stmt.run(amount, description, type)
  return getDb()
    .prepare('SELECT * FROM transactions WHERE id = ?')
    .get(result.lastInsertRowid) as Transaction
}

export function deleteTransaction(id: number): void {
  getDb().prepare('DELETE FROM transactions WHERE id = ?').run(id)
}

// ── Auto top-up ───────────────────────────────────────────────────────────────

export function checkAndDoTopup(): boolean {
  const s = getSettings()
  if (!s.parent_pin_hash) return false // not set up yet

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD UTC
  const dayOfWeek = new Date().getUTCDay() // 0=Sun … 6=Sat

  if (dayOfWeek !== s.topup_day) return false
  if (s.last_topup_date === today) return false // already topped up today

  addTransaction(s.weekly_amount, 'Veckopeng 🎁', 'topup')
  updateSettings({ last_topup_date: today })
  return true
}
