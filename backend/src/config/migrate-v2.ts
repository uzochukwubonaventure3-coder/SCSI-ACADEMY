import { pool } from './database'
import dotenv from 'dotenv'
dotenv.config()

const migration = `
-- ─── Add missing columns to content_users ────────────────────────────
ALTER TABLE content_users ADD COLUMN IF NOT EXISTS phone        VARCHAR(30);
ALTER TABLE content_users ADD COLUMN IF NOT EXISTS bio          TEXT;
ALTER TABLE content_users ADD COLUMN IF NOT EXISTS avatar_url   VARCHAR(500);
ALTER TABLE content_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE content_users ADD COLUMN IF NOT EXISTS verify_token VARCHAR(100);
ALTER TABLE content_users ADD COLUMN IF NOT EXISTS verify_token_expiry TIMESTAMPTZ;

-- ─── Blog post reads (progress tracking) ─────────────────────────────
CREATE TABLE IF NOT EXISTS content_reads (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES content_users(id) ON DELETE CASCADE,
  content_type VARCHAR(10) NOT NULL,  -- 'blog' or 'video'
  content_id INTEGER NOT NULL,
  read_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- ─── Search index on blog/video titles ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_blog_title   ON blog_posts  USING gin(to_tsvector('english', title || ' ' || COALESCE(excerpt,'')));
CREATE INDEX IF NOT EXISTS idx_video_title  ON video_posts USING gin(to_tsvector('english', title || ' ' || COALESCE(description,'')));

-- ─── Testimonial submissions (public form) ───────────────────────────
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- ─── Add sitemap fields to blog/video ────────────────────────────────
ALTER TABLE blog_posts  ADD COLUMN IF NOT EXISTS og_image VARCHAR(500);
ALTER TABLE video_posts ADD COLUMN IF NOT EXISTS og_image VARCHAR(500);

-- ─── Cookie consent log ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cookie_consents (
  id         SERIAL PRIMARY KEY,
  user_ip    VARCHAR(50),
  consented  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_reads_user ON content_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status    ON payments(status);
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running v2 migrations...')
    await client.query(migration)
    console.log('✅ V2 migrations complete.')
  } catch (err) {
    console.error('❌ V2 migration error:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
