import { pool } from './database'
import dotenv from 'dotenv'
dotenv.config()

const migrations = `
-- ─── Contact submissions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_submissions (
  id              SERIAL PRIMARY KEY,
  full_name       VARCHAR(150) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(30),
  inquiry_type    VARCHAR(60) NOT NULL DEFAULT 'General Inquiry',
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Refinery registrations ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refinery_registrations (
  id                  SERIAL PRIMARY KEY,
  full_name           VARCHAR(150) NOT NULL,
  level_or_profession VARCHAR(120) NOT NULL,
  primary_goal        TEXT NOT NULL,
  biggest_hurdle      TEXT NOT NULL,
  whatsapp_number     VARCHAR(30) NOT NULL,
  preferred_session   VARCHAR(30) NOT NULL DEFAULT 'Morning Cohort',
  email               VARCHAR(255),
  status              VARCHAR(30) DEFAULT 'pending',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Newsletter subscribers ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Blog posts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) UNIQUE NOT NULL,
  excerpt      TEXT,
  content      TEXT NOT NULL,
  cover_image  VARCHAR(500),
  tags         TEXT[] DEFAULT '{}',
  status       VARCHAR(20) DEFAULT 'draft',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Video posts ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_posts (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  slug            VARCHAR(255) UNIQUE NOT NULL,
  description     TEXT,
  video_url       VARCHAR(500) NOT NULL,
  thumbnail_url   VARCHAR(500),
  duration        VARCHAR(20),
  tags            TEXT[] DEFAULT '{}',
  status          VARCHAR(20) DEFAULT 'draft',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Testimonials ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  role        VARCHAR(150),
  quote       TEXT NOT NULL,
  avatar_url  VARCHAR(500),
  approved    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Gallery images ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_images (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255),
  image_url   VARCHAR(500) NOT NULL,
  alt_text    VARCHAR(255),
  category    VARCHAR(60),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seed approved testimonials ───────────────────────────────────────
INSERT INTO testimonials (name, role, quote, approved)
VALUES
  (
    'God''swill',
    'Voice Coach & Mentee',
    'SCSI didn''t just give me advice—it gave me a map. Coach Precious identified exactly what was holding me back and built a strategy that actually worked. I went from confused to commanding.',
    TRUE
  ),
  (
    'Student Voice Challenge Participant',
    'Public Speaking Graduate',
    'The Public Speaking Mastery program was unlike anything I experienced in school. I learned the architecture of a message—and now I can walk into any room and own it.',
    TRUE
  ),
  (
    'SCSI Mentorship Cohort Member',
    'Academic & Career Client',
    'I was a 400-level student with no clarity on my career path. After the Strategy Audit, I had a written plan with a 90-day execution map. The results speak for themselves.',
    TRUE
  )
ON CONFLICT DO NOTHING;
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running SCSI database migrations...')
    await client.query(migrations)
    console.log('✅ All tables created successfully.')
  } catch (err) {
    console.error('❌ Migration failed:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
