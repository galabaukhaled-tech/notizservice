import { createClient, type ResultSet } from "@libsql/client"

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Convert libsql Row (array-like) to a plain object using column names
export function toRows<T = Record<string, unknown>>(result: ResultSet): T[] {
  return result.rows.map((row) =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]]))
  ) as T[]
}

export function toRow<T = Record<string, unknown>>(result: ResultSet): T | null {
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return Object.fromEntries(result.columns.map((col, i) => [col, row[i]])) as T
}
