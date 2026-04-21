import { pool } from './database'
import dotenv from 'dotenv'
dotenv.config()

const migration = `
-- ─── Video preview fields ─────────────────────────────────────────────
-- preview_url: separate short clip URL (optional; if absent, frontend
--              uses the main video_url with end-time parameter)
-- preview_end_seconds: how many seconds of the main video to show as preview
ALTER TABLE video_posts
  ADD COLUMN IF NOT EXISTS preview_url            VARCHAR(500),
  ADD COLUMN IF NOT EXISTS preview_end_seconds    INTEGER NOT NULL DEFAULT 60;
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running v6 migrations (video preview fields)…')
    await client.query(migration)
    console.log('✅ V6 complete.')
  } catch (err) {
    console.error('❌ V6 error:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}
migrate()
