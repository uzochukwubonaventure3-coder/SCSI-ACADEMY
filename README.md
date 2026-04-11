# SCSI Academy — Full Stack Web Application

**Student Counseling Services International**  
Engineering Balanced Giants.

---

## Tech Stack

| Layer     | Technology                                 |
|-----------|--------------------------------------------|
| Frontend  | Next.js 15, TypeScript, Tailwind CSS, Framer Motion |
| Backend   | Node.js, Express.js, TypeScript            |
| Database  | PostgreSQL                                 |
| Hosting   | Vercel (frontend) + Railway (backend + DB) |

---

## Project Structure

```
scsi-academy/
├── frontend/          # Next.js 15 app
│   └── src/
│       ├── app/       # All pages
│       ├── components/# Navbar, Footer, Sections
│       ├── hooks/     # useTheme
│       ├── lib/       # API calls
│       ├── styles/    # globals.css (oxblood/cream theme)
│       └── types/     # TypeScript interfaces
└── backend/           # Express API
    └── src/
        ├── config/    # DB pool + migrations
        ├── middleware/ # Auth (JWT) + Validation (Zod)
        ├── routes/    # All API endpoints
        └── utils/     # Email + password hash
```

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally

### 1. Clone and install

```bash
# Install all dependencies
npm run install:all
```

### 2. Setup Backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/scsi_academy
FRONTEND_URL=http://localhost:3001
EMAIL_USER=preciouseze156@gmail.com
EMAIL_PASS=your_gmail_app_password
JWT_SECRET=your_random_32_char_secret_here
ADMIN_EMAIL=preciouseze156@gmail.com
ADMIN_PASSWORD_HASH=   # Generated in step 3
```

### 3. Generate admin password hash

```bash
cd backend
npx tsx src/utils/hashPassword.ts YourSecurePassword123
# Copy the output into .env as ADMIN_PASSWORD_HASH
```

### 4. Create database and run migrations

```bash
# Create the database in PostgreSQL
psql -U postgres -c "CREATE DATABASE scsi_academy;"

# Run migrations
npm run db:migrate
```

### 5. Setup Frontend environment

```bash
cd frontend
cp .env.example .env.local
# .env.local is already set to http://localhost:5000 for development
```

### 6. Start both servers

```bash
# Terminal 1 — Backend
npm run dev:backend
# Runs on http://localhost:5000

# Terminal 2 — Frontend
npm run dev:frontend
# Runs on http://localhost:3001
```

### Admin Panel

Visit: **http://localhost:3001/admin**  
Login with the email and password you set in `.env`

---

## Pages

| Route            | Description                              |
|------------------|------------------------------------------|
| `/`              | Home — Hero, Philosophy, Services, CTA  |
| `/about`         | About Coach Precious + SCSI story        |
| `/services`      | All 6 services with full detail          |
| `/blog`          | Text blog posts listing                  |
| `/videos`        | Video content with inline player         |
| `/gallery`       | Masonry photo gallery + lightbox         |
| `/contact`       | Intake contact form                      |
| `/refinery`      | Mentorship registration + confirmation   |
| `/admin`         | Admin panel (protected by JWT)           |

---

## API Endpoints

### Public
```
POST   /api/contact          # Contact form submission
POST   /api/refinery         # Mentorship registration
POST   /api/newsletter       # Newsletter subscription
GET    /api/blog             # List published blog posts
GET    /api/blog/:slug       # Single blog post
GET    /api/videos           # List published videos
GET    /api/testimonials     # Approved testimonials
GET    /api/gallery          # Gallery images
GET    /api/health           # Health check
```

### Admin (requires Bearer token)
```
POST   /api/admin/login             # Get JWT token
GET    /api/admin/dashboard         # Stats overview
GET    /api/admin/blog              # All blog posts
POST   /api/admin/blog              # Create post
PUT    /api/admin/blog/:id          # Update post
DELETE /api/admin/blog/:id          # Delete post
GET    /api/admin/videos            # All videos
POST   /api/admin/videos            # Add video
PUT    /api/admin/videos/:id        # Update video
DELETE /api/admin/videos/:id        # Delete video
GET    /api/admin/contacts          # View contact submissions
GET    /api/admin/registrations     # View refinery applications
GET    /api/admin/subscribers       # View newsletter subscribers
GET    /api/admin/testimonials      # All testimonials
PATCH  /api/admin/testimonials/:id/approve
DELETE /api/admin/testimonials/:id
POST   /api/admin/gallery           # Add gallery image
DELETE /api/admin/gallery/:id       # Remove image
```

---

## Deployment

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project
2. **Add PostgreSQL** plugin — Railway auto-sets `DATABASE_URL`
3. Connect your GitHub repo → select the `backend` folder
4. Under **Variables**, add all values from `.env.example`
5. Set **Start Command**: `npm run build && npm start`
6. After first deploy, run migrations:
   ```
   # In Railway shell:
   npm run db:migrate
   ```
7. Copy your Railway URL, e.g. `https://scsi-api.up.railway.app`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect GitHub repo → select the `frontend` folder
3. Under **Environment Variables**, add:
   ```
   NEXT_PUBLIC_API_URL=https://scsi-api.up.railway.app
   ```
4. Deploy — Vercel auto-detects Next.js
5. Your site: `https://scsi-academy.vercel.app`

### Custom Domain (optional)
- In Vercel → Settings → Domains → Add your domain
- Point your DNS records as instructed by Vercel

---

## Gmail App Password Setup (for email notifications)

1. Go to your Google Account → Security
2. Enable 2-Factor Authentication
3. Go to **App Passwords** → Select "Mail" → Generate
4. Copy the 16-char password → paste as `EMAIL_PASS` in `.env`

---

## Adding Content as Admin

1. Visit `/admin` on your live site
2. Login with your credentials
3. **Blog Posts** → New Post → Write content (markdown or plain text) → Publish
4. **Videos** → Add Video → Paste YouTube embed URL (format: `https://www.youtube.com/embed/VIDEO_ID`)
5. **Testimonials** → Review submitted testimonials → Approve to show on site
6. **Gallery** → Add image URL (upload to Cloudinary or any image host first)

---

## Theme

The site uses an **Oxblood (dark)** default theme with a **Cream/Ivory (light)** toggle.

The toggle button is in the Navbar top-right corner.

CSS Variables are defined in `src/styles/globals.css` and can be customized.

---

## Support

Built for **SCSI Academy — Eze Tochukwu Precious**  
Contact: preciouseze156@gmail.com  
WhatsApp: +234 901 805 3015

