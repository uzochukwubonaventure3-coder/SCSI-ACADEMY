/**
 * Migration v11 — Add email to refinery_registrations
 * so admin can broadcast to intake form applicants by email.
 */
import { pool } from './database'
import dotenv from 'dotenv'
dotenv.config()

const migration = `
ALTER TABLE refinery_registrations
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running v11 — adding email to refinery_registrations…')
    await client.query(migration)
    console.log('✅ V11 complete.')
  } catch (err) {
    console.error('❌ V11 error:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}
migrate()
