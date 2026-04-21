import { pool } from './database'
import dotenv from 'dotenv'
dotenv.config()

const migration = `
-- ─── Video discount fields ────────────────────────────────────────────
ALTER TABLE video_posts
  ADD COLUMN IF NOT EXISTS discount_percent    INTEGER CHECK (discount_percent BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS discount_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outcomes            TEXT[],   -- bullet points: what they'll gain
  ADD COLUMN IF NOT EXISTS target_audience     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS lessons             TEXT[];   -- locked lesson list for paywall

-- ─── View intents (for follow-up notifications) ───────────────────────
CREATE TABLE IF NOT EXISTS video_view_intents (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES content_users(id) ON DELETE CASCADE,
  video_id      INTEGER NOT NULL REFERENCES video_posts(id)   ON DELETE CASCADE,
  notified_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- ─── System monitoring log ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_events (
  id         SERIAL PRIMARY KEY,
  type       VARCHAR(50) NOT NULL,  -- 'webhook', 'error', 'payment'
  payload    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_intents_user    ON video_view_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_video_intents_created ON video_view_intents(created_at);
CREATE INDEX IF NOT EXISTS idx_system_events_type    ON system_events(type);
CREATE INDEX IF NOT EXISTS idx_system_events_created ON system_events(created_at);
CREATE INDEX IF NOT EXISTS idx_video_posts_discount  ON video_posts(discount_expires_at) WHERE discount_expires_at IS NOT NULL;
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running v8 migrations (discounts + view intents + system events)…')
    await client.query(migration)
    console.log('✅ V8 complete.')
  } catch (err) {
    console.error('❌ V8 error:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}
migrate()
