import { pool } from './database'
import dotenv from 'dotenv'
dotenv.config()

const migration = `
-- ─── Video pricing & categorization ──────────────────────────────────
ALTER TABLE video_posts ADD COLUMN IF NOT EXISTS price_kobo  INTEGER NOT NULL DEFAULT 200000;
ALTER TABLE video_posts ADD COLUMN IF NOT EXISTS is_free     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE video_posts ADD COLUMN IF NOT EXISTS category    VARCHAR(80);

-- ─── Video purchases ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_purchases (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES content_users(id) ON DELETE CASCADE,
  video_id          INTEGER NOT NULL REFERENCES video_posts(id)   ON DELETE CASCADE,
  amount_kobo       INTEGER NOT NULL DEFAULT 0,
  payment_reference VARCHAR(255),           -- NULL when paid via wallet
  paid_via          VARCHAR(20) NOT NULL DEFAULT 'paystack', -- 'paystack' | 'wallet'
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)                 -- prevent duplicate purchases
);

-- ─── Wallets (one per user) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER UNIQUE NOT NULL REFERENCES content_users(id) ON DELETE CASCADE,
  balance_kobo INTEGER NOT NULL DEFAULT 0
                 CHECK (balance_kobo >= 0),  -- DB-level guard against negative balance
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Wallet transactions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES content_users(id) ON DELETE CASCADE,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('credit','debit')),
  amount_kobo INTEGER NOT NULL CHECK (amount_kobo > 0),
  reference   VARCHAR(255),                -- Paystack ref for credits; video slug for debits
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_video_purchases_user  ON video_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_video_purchases_video ON video_purchases(video_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user          ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user        ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_ref         ON wallet_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_video_category        ON video_posts(category);
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running v5 migrations (wallet + video purchases + categories)…')
    await client.query(migration)
    console.log('✅ V5 migrations complete.')
  } catch (err) {
    console.error('❌ V5 migration error:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
