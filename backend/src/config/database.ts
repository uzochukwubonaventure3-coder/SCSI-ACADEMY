import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})


export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    console.log(' PostgreSQL connected at:', result.rows[0].now)
    client.release()
  } catch (err) {
    console.error(' PostgreSQL connection failed:', err)
    process.exit(1)
  }
}

export async function query(text: string, params?: unknown[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB Query]', { text: text.substring(0, 60), duration: `${duration}ms`, rows: res.rowCount })
    }
    return res
  } catch (err) {
    console.error('[DB Error]', { text, err })
    throw err
  }
}
console.log("DATABASE_URL =", process.env.DATABASE_URL)