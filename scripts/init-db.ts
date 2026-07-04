import { createClient } from "@libsql/client"
import * as dotenv from "dotenv"
import { resolve } from "path"

dotenv.config({ path: resolve(process.cwd(), ".env.local") })

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

;(async () => {
  await db.executeMultiple(`
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
      gewerk TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "Order" (
      id TEXT PRIMARY KEY,
      customOrderId TEXT NOT NULL DEFAULT '',
      customerId TEXT NOT NULL REFERENCES Customer(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL DEFAULT '',
      endTime TEXT NOT NULL DEFAULT '',
      employeeId TEXT NOT NULL REFERENCES Employee(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      gewerk TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'offen',
      priority TEXT NOT NULL DEFAULT 'normal',
      phase TEXT NOT NULL DEFAULT '',
      value REAL NOT NULL DEFAULT 0,
      followUpDate TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `)

  // Migration: add columns to existing tables (idempotent)
  const columnMigrations: Record<string, string> = {
    "Order.customOrderId": `ALTER TABLE "Order" ADD COLUMN customOrderId TEXT NOT NULL DEFAULT ''`,
    "Order.endTime": `ALTER TABLE "Order" ADD COLUMN endTime TEXT NOT NULL DEFAULT ''`,
    "Order.gewerk": `ALTER TABLE "Order" ADD COLUMN gewerk TEXT NOT NULL DEFAULT ''`,
    "Order.priority": `ALTER TABLE "Order" ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal'`,
    "Order.phase": `ALTER TABLE "Order" ADD COLUMN phase TEXT NOT NULL DEFAULT ''`,
    "Order.value": `ALTER TABLE "Order" ADD COLUMN value REAL NOT NULL DEFAULT 0`,
    "Order.followUpDate": `ALTER TABLE "Order" ADD COLUMN followUpDate TEXT NOT NULL DEFAULT ''`,
    "Customer.gewerk": `ALTER TABLE Customer ADD COLUMN gewerk TEXT NOT NULL DEFAULT ''`,
  }
  for (const [column, sql] of Object.entries(columnMigrations)) {
    try {
      await db.execute(sql)
      console.log(`Migration: ${column} Spalte hinzugefügt`)
    } catch {
      // Column already exists
    }
  }

  console.log("Schema erfolgreich in Turso angelegt")
  db.close()
})()
