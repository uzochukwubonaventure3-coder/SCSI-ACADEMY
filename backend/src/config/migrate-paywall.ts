import { pool } from './database'
import dotenv from 'dotenv'
dotenv.config()

const migration = `
-- ─── Content users (people who paid for access) ───────────────────────
CREATE TABLE IF NOT EXISTS content_users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan          VARCHAR(20) NOT NULL DEFAULT 'lifetime',
  expires_at    TIMESTAMPTZ,              -- NULL = lifetime access
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Payment records ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES content_users(id) ON DELETE SET NULL,
  email           VARCHAR(255) NOT NULL,
  reference       VARCHAR(255) UNIQUE NOT NULL,
  plan            VARCHAR(20) NOT NULL,
  amount_kobo     INTEGER NOT NULL,
  currency        VARCHAR(10) DEFAULT 'NGN',
  status          VARCHAR(20) DEFAULT 'pending',  -- pending | success | failed
  paystack_data   JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_users_email ON content_users(email);
CREATE INDEX IF NOT EXISTS idx_payments_reference  ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_user_id    ON payments(user_id);
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running paywall migration...')
    await client.query(migration)
    console.log('✅ Paywall tables created.')
  } catch (err) {
    console.error('❌ Paywall migration failed:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
