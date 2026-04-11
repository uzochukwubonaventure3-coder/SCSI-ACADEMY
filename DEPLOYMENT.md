# SCSI Academy — Deployment Guide

## Pre-Deployment Checklist

### Backend (.env variables needed on Railway)
```
PORT=5000
NODE_ENV=production
DATABASE_URL=          ← Auto-provided by Railway PostgreSQL plugin
FRONTEND_URL=          ← Your Vercel URL e.g. https://scsi-academy.vercel.app
JWT_SECRET=            ← Random 32+ char string
ADMIN_EMAIL=           ← preciouseze156@gmail.com
ADMIN_PASSWORD_HASH=   ← Run: npm run hash-password YourPassword
PAYSTACK_PUBLIC_KEY=   ← pk_live_xxxx from Paystack dashboard
PAYSTACK_SECRET_KEY=   ← sk_live_xxxx from Paystack dashboard
PRICE_MONTHLY_KOBO=1000000
PRICE_QUARTERLY_KOBO=2500000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=            ← Your Gmail
EMAIL_PASS=            ← Gmail App Password (not regular password)
EMAIL_FROM=            ← SCSI Academy <preciouseze156@gmail.com>
```

### Frontend (.env variables needed on Vercel)
```
NEXT_PUBLIC_API_URL=   ← Your Railway backend URL e.g. https://scsi-api.up.railway.app
```

## Deploy Backend to Railway

1. Push code to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Select your repo → select `backend` folder as root
4. Add PostgreSQL plugin → DATABASE_URL is auto-set
5. Add all env variables above under Variables tab
6. After first deploy, open Railway shell and run:
   ```
   npm run db:migrate
   npm run db:migrate-paywall
   ```
7. Generate admin password:
   ```
   npm run hash-password YourSecurePassword123
   ```
   Copy output into ADMIN_PASSWORD_HASH env var

## Deploy Frontend to Vercel

1. Go to vercel.com → New Project → Import from GitHub
2. Set Root Directory to `frontend`
3. Add NEXT_PUBLIC_API_URL env variable pointing to Railway URL
4. Deploy

## Post-Deployment

1. Visit your-domain.vercel.app/admin
2. Login with your email + password
3. Add blog posts and videos through the admin panel
4. Upload coach photo via the gallery section

## Paystack Live Mode

Switch from test to live keys in your Railway env vars:
- PAYSTACK_PUBLIC_KEY: pk_live_xxxx
- PAYSTACK_SECRET_KEY: sk_live_xxxx

Add webhook URL in Paystack dashboard:
`https://your-railway-url.up.railway.app/api/paywall/webhook`
