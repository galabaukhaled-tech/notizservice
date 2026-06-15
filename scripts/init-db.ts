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
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS "Order" (
      id TEXT PRIMARY KEY,
      customOrderId TEXT NOT NULL DEFAULT '',
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

  // Migration: add customOrderId column to existing Order tables
  try {
    await db.execute(`ALTER TABLE "Order" ADD COLUMN customOrderId TEXT NOT NULL DEFAULT ''`)
    console.log("Migration: customOrderId Spalte hinzugefügt")
  } catch {
    // Column already exists
  }

  console.log("Schema erfolgreich in Turso angelegt")
  db.close()
})()
