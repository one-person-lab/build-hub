import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH =
  process.env.DATA_PATH || path.join(process.cwd(), "data", "buildhub.db");

let db: Database.Database | null = null;

function migrate(d: Database.Database) {
  d.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      pro_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS verify_codes (
      email TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_sent_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL REFERENCES users(id),
      slug TEXT NOT NULL,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, slug)
    );
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      slugs TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS collections_user ON collections(user_id);
    CREATE TABLE IF NOT EXISTS notes (
      user_id INTEGER NOT NULL REFERENCES users(id),
      slug TEXT NOT NULL,
      body TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, slug)
    );
    CREATE TABLE IF NOT EXISTS orders (
      out_trade_no TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      plan TEXT NOT NULL,
      name TEXT NOT NULL,
      money TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      trade_no TEXT,
      channel TEXT NOT NULL DEFAULT 'wx',
      paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    /* 一键复刻出来的个人副本：公开档案留在静态 JSON，这里只存用户自己的那份 */
    CREATE TABLE IF NOT EXISTS forks (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      playbook_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS forks_user ON forks(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS forks_user_playbook ON forks(user_id, playbook_id);
    CREATE TABLE IF NOT EXISTS fork_steps (
      fork_id TEXT NOT NULL REFERENCES forks(id),
      step_index INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      result TEXT NOT NULL DEFAULT '',
      blocker TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (fork_id, step_index)
    );
    /* 复制提示词的账：免费账号按累计次数卡额度，PRO 不限 */
    CREATE TABLE IF NOT EXISTS prompt_copies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      source TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS prompt_copies_user ON prompt_copies(user_id);
  `);
  /* 老库补列：orders 原来只有微信一条渠道，人工开通的单要能被单独捞出来核对 */
  const cols = d.prepare(`pragma table_info(orders)`).all() as { name: string }[];
  if (!cols.some((c) => c.name === "channel"))
    d.exec(`alter table orders add column channel text not null default 'wx'`);
}

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  migrate(db);
  return db;
}

export function nowIso(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export function proActive(proUntil: string | null | undefined): boolean {
  if (!proUntil) return false;
  return new Date(proUntil.replace(" ", "T") + "Z").getTime() > Date.now();
}

export function userIsPro(userId: number): boolean {
  const row = getDb()
    .prepare(`select pro_until from users where id = ?`)
    .get(userId) as { pro_until: string | null } | undefined;
  return proActive(row?.pro_until);
}
