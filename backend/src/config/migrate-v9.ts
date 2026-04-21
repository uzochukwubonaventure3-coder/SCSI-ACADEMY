import { pool } from './database'
import dotenv from 'dotenv'
dotenv.config()

const migration = `
-- ─── Expand plan types ───────────────────────────────────────────────
ALTER TABLE content_users
  ALTER COLUMN plan SET DEFAULT 'academy';

-- ─── Video category purchases ─────────────────────────────────────────
-- Monthly/academy subscribers can buy an entire category at once (₦2,000)
-- 3-month+ subscribers get all categories included
CREATE TABLE IF NOT EXISTS category_purchases (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES content_users(id) ON DELETE CASCADE,
  category          VARCHAR(80) NOT NULL,
  amount_kobo       INTEGER NOT NULL DEFAULT 200000,  -- ₦2,000
  payment_reference VARCHAR(255),
  paid_via          VARCHAR(20) NOT NULL DEFAULT 'paystack',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_cat_purchases_user ON category_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_cat_purchases_cat  ON category_purchases(category);

-- ─── Category price config (admin-settable) ──────────────────────────
CREATE TABLE IF NOT EXISTS category_prices (
  category    VARCHAR(80) PRIMARY KEY,
  price_kobo  INTEGER NOT NULL DEFAULT 200000,  -- ₦2,000
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Default category prices
INSERT INTO category_prices (category, price_kobo, description) VALUES
  ('Mindset',    200000, 'All Mindset videos'),
  ('Finance',    200000, 'All Finance videos'),
  ('Leadership', 200000, 'All Leadership videos'),
  ('Speaking',   200000, 'All Public Speaking videos'),
  ('Career',     200000, 'All Career videos')
ON CONFLICT (category) DO NOTHING;
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running v9 (category purchases + plan expansion)…')
    await client.query(migration)
    console.log('✅ V9 complete.')
  } catch (err) {
    console.error('❌ V9 error:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}
migrate()
