import { pool } from './database'
import dotenv from 'dotenv'
dotenv.config()

const migration = `
-- ─── Coupons ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(50) UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  expires_at      TIMESTAMPTZ,                          -- NULL = never expires
  usage_limit     INTEGER,                              -- NULL = unlimited
  used_count      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code       ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active     ON coupons(is_active);

-- ─── Coupon usage log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupon_uses (
  id         SERIAL PRIMARY KEY,
  coupon_id  INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES content_users(id) ON DELETE CASCADE,
  video_id   INTEGER REFERENCES video_posts(id) ON DELETE SET NULL,
  used_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, video_id)   -- one use per coupon per video per user
);

CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon ON coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_user   ON coupon_uses(user_id);

-- ─── Analytics indexes (if not already exist) ────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_status        ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at    ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_video_purchases_paid   ON video_purchases(paid_via);
CREATE INDEX IF NOT EXISTS idx_video_purchases_created ON video_purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type         ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created      ON wallet_transactions(created_at);
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running v7 (coupons + analytics indexes)…')
    await client.query(migration)
    console.log('✅ V7 complete.')
  } catch (err) {
    console.error('❌ V7 error:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}
migrate()
