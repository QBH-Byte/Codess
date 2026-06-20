const Database = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'orders.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chef TEXT NOT NULL,
      item TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT '份',
      note TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','purchased')),
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      purchased_at TEXT
    )
  `);
}

module.exports = { getDb };
