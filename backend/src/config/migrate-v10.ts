/**
 * Migration v10 — Performance indexes
 * These indexes speed up the most common queries:
 * - Video listing by category and status
 * - Purchase lookups per user
 * - Notification reads per user
 * - Blog post queries
 */
import { pool } from './database'
import dotenv from 'dotenv'
dotenv.config()

const migration = `
-- ─── Video posts ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_video_posts_status         ON video_posts(status);
CREATE INDEX IF NOT EXISTS idx_video_posts_status_cat     ON video_posts(status, category) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_video_posts_created        ON video_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_posts_slug           ON video_posts(slug);

-- ─── Video purchases ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_video_purchases_user       ON video_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_video_purchases_video      ON video_purchases(video_id);

-- ─── Category purchases ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cat_purchases_user_cat     ON category_purchases(user_id, category);

-- ─── Payments ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_status_created    ON payments(status, created_at DESC);

-- ─── Notifications ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_read    ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- ─── Blog posts ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_blog_posts_status          ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug            ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created         ON blog_posts(created_at DESC);

-- ─── Content users ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_content_users_active       ON content_users(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_content_users_plan         ON content_users(plan);

-- ─── Wallet transactions ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created     ON wallet_transactions(user_id, created_at DESC);

-- ─── View intents ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_view_intents_notified      ON video_view_intents(notified_at) WHERE notified_at IS NULL;
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running v10 — performance indexes…')
    await client.query(migration)
    console.log('✅ V10 complete.')
  } catch (err) {
    console.error('❌ V10 error:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
