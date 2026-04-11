import { pool } from './database'
import dotenv from 'dotenv'
dotenv.config()

const migration = `
-- Add role to content_users (student | admin)
ALTER TABLE content_users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student';

-- Create admin_users table (separate from content_users)
CREATE TABLE IF NOT EXISTS admin_users (
  id              SERIAL PRIMARY KEY,
  full_name       VARCHAR(150) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  avatar_url      VARCHAR(500),
  role            VARCHAR(20) DEFAULT 'admin',
  is_active       BOOLEAN DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue summary view
CREATE OR REPLACE VIEW revenue_summary AS
SELECT
  COUNT(*)                                                    AS total_payments,
  COUNT(*) FILTER (WHERE status = 'success')                  AS successful_payments,
  COALESCE(SUM(amount_kobo) FILTER (WHERE status='success'),0)AS total_kobo,
  COUNT(*) FILTER (WHERE plan='monthly'   AND status='success') AS monthly_count,
  COUNT(*) FILTER (WHERE plan='quarterly' AND status='success') AS quarterly_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND status='success') AS last_30_days_count,
  COALESCE(SUM(amount_kobo) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND status='success'),0) AS last_30_days_kobo
FROM payments;

-- Student session notes (admin can add notes about a student)
CREATE TABLE IF NOT EXISTS student_notes (
  id         SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES content_users(id) ON DELETE CASCADE,
  admin_note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_users_role ON content_users(role);
CREATE INDEX IF NOT EXISTS idx_student_notes_student ON student_notes(student_id);
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running v3 migrations (role + admin_users + revenue)...')
    await client.query(migration)
    console.log('✅ V3 migrations complete.')
  } catch (err) { console.error('❌ V3 migration error:', err); throw err }
  finally { client.release(); await pool.end() }
}
migrate()
