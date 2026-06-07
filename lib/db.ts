import path from "path"
import type Database from "better-sqlite3"

declare global {
  // eslint-disable-next-line no-var
  var _db: Database.Database | undefined
}

function openDatabase(): Database.Database {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const BetterSqlite3 = require("better-sqlite3") as typeof Database
  const dbPath = path.join(process.cwd(), "dev.db")
  const database = new BetterSqlite3(dbPath)
  database.pragma("journal_mode = WAL")
  database.pragma("foreign_keys = ON")
  initSchema(database)
  return database
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS Employee (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Customer (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "Order" (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL REFERENCES Customer(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL DEFAULT '',
      employeeId TEXT NOT NULL REFERENCES Employee(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'offen',
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `)

  // Migration: add time column to existing Order tables
  try {
    database.exec(`ALTER TABLE "Order" ADD COLUMN time TEXT NOT NULL DEFAULT ''`)
  } catch {
    // Column already exists — ignore
  }
}

export const db: Database.Database =
  globalThis._db ?? openDatabase()

if (process.env.NODE_ENV !== "production") {
  globalThis._db = db
}
