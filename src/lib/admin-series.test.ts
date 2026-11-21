import Database from 'better-sqlite3';
import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSeries } from './admin-series.ts';

function makeDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE orders (
      out_trade_no TEXT PRIMARY KEY, user_id INTEGER, plan TEXT, name TEXT,
      money TEXT, status TEXT, trade_no TEXT, channel TEXT,
      paid_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

// 时间用 UTC 字符串（线上库存的是 datetime('now')，即 UTC）
const insOrder = (db: Database.Database) =>
  db.prepare(
    `INSERT INTO orders (out_trade_no, plan, money, status, paid_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

test('按东八区分月，验证单剔除到 testRevenue 不计营收', () => {
  const db = makeDb();
  const ins = insOrder(db);
  ins.run('real-1', 'yearly', '58.00', 'paid', '2026-10-05 06:00:00', '2026-10-05 06:00:00');
  ins.run('verify-o1', 'test', '0.01', 'paid', '2026-10-21 06:00:00', '2026-10-21 06:00:00');
  ins.run('cancelled-1', 'yearly', '58.00', 'cancelled', '2026-10-28 05:00:00', '2026-10-28 05:00:00');
  db.prepare('INSERT INTO users (id, created_at) VALUES (?, ?)').run(1, '2026-10-03 06:00:00');

  const result = buildSeries(
    db,
    { from: '2026-09-01', to: '2026-11-01', granularity: 'month' },
    Date.parse('2026-11-01T00:00:00Z'),
  )!;
  assert.equal(result.granularity, 'month');
  // to 是闭区间上界（含当日），09-01 ~ 11-01 生成三个月桶
  assert.deepEqual(
    result.buckets.map((b) => b.bucket),
    ['2026-09', '2026-10', '2026-11'],
  );
  const oct = result.buckets.find((b) => b.bucket === '2026-10')!;
  assert.equal(oct.revenue, 58);
  assert.equal(oct.orders, 1);
  assert.equal(oct.testRevenue, 0.01);
  assert.equal(oct.testOrders, 1);
  assert.equal(oct.newUsers, 1);
  db.close();
});

test('空桶补齐，未付订单不进营收', () => {
  const db = makeDb();
  const ins = insOrder(db);
  ins.run('pending-1', 'monthly', '9.90', 'pending', null, '2026-11-16 06:00:00');

  const result = buildSeries(
    db,
    { from: '2026-08-01', to: '2026-11-21', granularity: 'month' },
    Date.parse('2026-11-21T00:00:00Z'),
  )!;
  assert.equal(result.buckets.length, 4);
  assert.ok(result.buckets.every((b) => b.revenue === 0 && b.orders === 0));
  db.close();
});

test('时间范围不合法返回 null', () => {
  const db = makeDb();
  const result = buildSeries(db, { from: '2026-11-21', to: '2026-11-01' });
  assert.equal(result, null);
  db.close();
});
