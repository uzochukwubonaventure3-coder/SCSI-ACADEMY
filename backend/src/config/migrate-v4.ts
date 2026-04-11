import { pool } from './database'
import dotenv from 'dotenv'
dotenv.config()

const migration = `
-- ─── In-app notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES content_users(id) ON DELETE CASCADE,
  type        VARCHAR(30) NOT NULL DEFAULT 'content',
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  link        VARCHAR(500),
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Message broadcasts (admin → subscribers) ─────────────────────────
CREATE TABLE IF NOT EXISTS broadcasts (
  id          SERIAL PRIMARY KEY,
  subject     VARCHAR(255) NOT NULL,
  body        TEXT NOT NULL,
  audience    VARCHAR(30) NOT NULL DEFAULT 'all',
  sent_count  INTEGER DEFAULT 0,
  status      VARCHAR(20) DEFAULT 'sent',
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Phone edit tracking ──────────────────────────────────────────────
ALTER TABLE content_users ADD COLUMN IF NOT EXISTS phone_edit_count INTEGER DEFAULT 0;

-- ─── Cloudinary video URLs ────────────────────────────────────────────
ALTER TABLE video_posts ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running v4 migrations...')
    await client.query(migration)
    console.log('✅ V4 done')
  } catch (err) { console.error('❌ V4 error:', err); throw err }
  finally { client.release(); await pool.end() }
}
migrate()
