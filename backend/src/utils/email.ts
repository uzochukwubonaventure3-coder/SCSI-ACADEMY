import { Resend } from 'resend'
import dotenv from 'dotenv'
dotenv.config()

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const brandColors = { bg: '#0D0507', card: '#1A0C0D', gold: '#C9A24B', text: '#F0E6D0', muted: '#9A7860' }

function baseTemplate(title: string, body: string): string {
  return `
  <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:${brandColors.bg};color:${brandColors.text};padding:2rem;border-radius:16px;">
    <div style="border-bottom:1px solid rgba(201,162,75,0.2);padding-bottom:1.25rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.75rem;">
      <span style="font-family:Georgia,serif;font-size:1.25rem;font-weight:700;color:${brandColors.gold}">SCSI</span>
      <span style="font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;color:${brandColors.muted}">Academy</span>
    </div>
    <h2 style="font-family:Georgia,serif;font-size:1.375rem;font-weight:700;color:${brandColors.text};margin-bottom:1.25rem;">${title}</h2>
    ${body}
    <div style="border-top:1px solid rgba(201,162,75,0.15);margin-top:2rem;padding-top:1.25rem;font-size:0.75rem;color:${brandColors.muted};">
      <p>© SCSI Academy · Eze Tochukwu Precious</p>
      <p style="margin-top:0.25rem;font-style:italic;">Stop running in circles. Start engineering your legacy.</p>
    </div>
  </div>`
}

// Send email with silent fail + log
async function send(to: string, subject: string, html: string) {
  if (!resend) { 
    console.log(`[EMAIL SKIP] No RESEND_API_KEY. Subject: ${subject}`); 
    return 
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SCSI Academy <onboarding@resend.dev>',
      to,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, '') // ✅ auto-generate plain text
    })

    console.log(`[EMAIL SENT] ${subject} → ${to}`)
  } catch (err) {
    console.error(`[EMAIL FAILED] ${subject} → ${to}:`, err)
  }
}

// ── Email verification ──────────────────────────────────────────────
export async function sendVerificationEmail(to: string, fullName: string, token: string) {
  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`
  const html = baseTemplate('Verify Your Email Address', `
    <p style="color:${brandColors.muted};line-height:1.8;margin-bottom:1.5rem;">Hi <strong style="color:${brandColors.text}">${fullName}</strong>, thank you for joining SCSI Academy. Please verify your email address to complete your account setup.</p>
    <div style="text-align:center;margin:2rem 0;">
      <a href="${link}" style="display:inline-block;padding:0.875rem 2rem;background:${brandColors.gold};color:#080506;font-weight:700;font-size:0.875rem;letter-spacing:0.08em;text-decoration:none;border-radius:8px;">Verify Email Address</a>
    </div>
    <p style="font-size:0.8rem;color:${brandColors.muted};line-height:1.7;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
    <p style="font-size:0.75rem;color:${brandColors.muted};margin-top:1rem;word-break:break-all;">Or copy this link: ${link}</p>
  `)
  await send(to, 'Verify your SCSI Academy email', html)
}

// ── Contact notification ────────────────────────────────────────────
export async function sendContactNotification(data: { fullName: string; email: string; phone?: string; inquiryType: string; message: string }) {
  const html = baseTemplate(`New ${data.inquiryType} Inquiry`, `
    <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">
      ${[['Name', data.fullName], ['Email', data.email], ['Phone', data.phone || '—'], ['Type', data.inquiryType]].map(([k, v]) =>
        `<tr><td style="padding:0.625rem;font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:${brandColors.gold};width:100px">${k}</td><td style="padding:0.625rem;color:${brandColors.text}">${v}</td></tr>`
      ).join('')}
    </table>
    <div style="padding:1.25rem;background:rgba(201,162,75,0.06);border-left:3px solid ${brandColors.gold};border-radius:0 8px 8px 0;margin-bottom:1rem;">
      <p style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:${brandColors.gold};margin-bottom:0.5rem;">Message</p>
      <p style="color:${brandColors.muted};line-height:1.8;">${data.message}</p>
    </div>
    <a href="mailto:${data.email}" style="display:inline-block;padding:0.625rem 1.25rem;background:${brandColors.gold};color:#080506;font-weight:700;font-size:0.75rem;text-decoration:none;border-radius:6px;">Reply to ${data.fullName}</a>
  `)
  await send(process.env.ADMIN_EMAIL || '', `[SCSI] ${data.inquiryType} — ${data.fullName}`, html)
}

// ── Refinery registration notification ─────────────────────────────
export async function sendRefineryNotification(data: { fullName: string; levelOrProfession: string; primaryGoal: string; biggestHurdle: string; whatsappNumber: string; preferredSession: string }) {
  const html = baseTemplate('New Refinery Application 🔥', `
    <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">
      ${[['Name', data.fullName], ['Level', data.levelOrProfession], ['WhatsApp', data.whatsappNumber], ['Session', data.preferredSession]].map(([k,v]) =>
        `<tr><td style="padding:0.5rem;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:${brandColors.gold};width:100px">${k}</td><td style="padding:0.5rem;color:${brandColors.text}">${v}</td></tr>`
      ).join('')}
    </table>
    <div style="padding:1.125rem;background:rgba(201,162,75,0.06);border-left:3px solid ${brandColors.gold};border-radius:0 8px 8px 0;margin-bottom:0.875rem;">
      <p style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.1em;color:${brandColors.gold};margin-bottom:0.375rem;">90-Day Goal</p>
      <p style="color:${brandColors.muted};line-height:1.75;">${data.primaryGoal}</p>
    </div>
    <div style="padding:1.125rem;background:rgba(124,26,26,0.12);border-left:3px solid #7C1A1A;border-radius:0 8px 8px 0;">
      <p style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.1em;color:${brandColors.gold};margin-bottom:0.375rem;">Biggest Hurdle</p>
      <p style="color:${brandColors.muted};line-height:1.75;">${data.biggestHurdle}</p>
    </div>
  `)
  await send(process.env.ADMIN_EMAIL || '', `[SCSI Refinery] Application — ${data.fullName}`, html)
}

// ── Welcome email after successful payment ──────────────────────────
export async function sendWelcomeEmail(to: string, fullName: string, plan: string, expiresAt: string | null) {
  const planLabel = plan === 'quarterly' ? '3-Month Bundle' : 'Monthly Access'
  const expiry = expiresAt ? new Date(expiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Never'
  const html = baseTemplate('Welcome to the Refinery! 🎉', `
    <p style="color:${brandColors.muted};line-height:1.8;margin-bottom:1.5rem;">Hi <strong style="color:${brandColors.text}">${fullName}</strong>, your payment was successful. You now have <strong style="color:${brandColors.gold}">${planLabel}</strong> to all SCSI Academy content.</p>
    <div style="padding:1.5rem;background:rgba(201,162,75,0.07);border:1px solid rgba(201,162,75,0.2);border-radius:12px;margin-bottom:1.5rem;">
      <p style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.12em;color:${brandColors.gold};margin-bottom:0.75rem;">Your Access</p>
      <p style="font-size:1rem;font-weight:700;color:${brandColors.text};margin-bottom:0.25rem;">${planLabel}</p>
      <p style="font-size:0.85rem;color:${brandColors.muted};">Valid until: ${expiry}</p>
    </div>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/content" style="display:inline-block;padding:0.875rem 2rem;background:${brandColors.gold};color:#080506;font-weight:700;font-size:0.875rem;text-decoration:none;border-radius:8px;">Access Your Content →</a>
    </div>
    <p style="font-size:0.8rem;color:${brandColors.muted};margin-top:1.5rem;line-height:1.7;">Have questions? Reply to this email or reach Coach Precious on <a href="https://wa.me/2349018053015" style="color:${brandColors.gold};">WhatsApp</a>.</p>
  `)
  await send(to, 'Welcome to SCSI Academy — Your access is ready!', html)
}

// ── Password reset email ────────────────────────────────────────────
export async function sendPasswordResetEmail(to: string, fullName: string, token: string) {
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
  const html = baseTemplate('Reset Your Password', `
    <p style="color:${brandColors.muted};line-height:1.8;margin-bottom:1.5rem;">Hi <strong style="color:${brandColors.text}">${fullName}</strong>, we received a request to reset your SCSI Academy password.</p>
    <div style="text-align:center;margin:2rem 0;">
      <a href="${link}" style="display:inline-block;padding:0.875rem 2rem;background:${brandColors.gold};color:#080506;font-weight:700;font-size:0.875rem;letter-spacing:0.08em;text-decoration:none;border-radius:8px;">Reset My Password</a>
    </div>
    <p style="font-size:0.8rem;color:${brandColors.muted};line-height:1.7;">This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.</p>
    <p style="font-size:0.75rem;color:${brandColors.muted};margin-top:1rem;word-break:break-all;">Or copy this link: ${link}</p>
  `)
  await send(to, 'Reset your SCSI Academy password', html)
}

// ── Broadcast email (admin → many) ──────────────────────────────────
export async function sendBroadcastEmail(to: string[], subject: string, bodyHtml: string) {
  if (!resend) { console.log(`[EMAIL SKIP] No RESEND_API_KEY. Broadcast to ${to.length} users`); return }
  if (!to.length) return

  const html = baseTemplate(subject, `
    <div style="color:${brandColors.muted};line-height:1.85;font-size:0.9375rem;">${bodyHtml}</div>
    <div style="margin-top:2rem;padding-top:1.25rem;border-top:1px solid rgba(201,162,75,0.15);">
      <a href="${process.env.FRONTEND_URL}/content" style="display:inline-block;padding:0.75rem 1.5rem;background:${brandColors.gold};color:#080506;font-weight:700;font-size:0.875rem;text-decoration:none;border-radius:8px;">Visit SCSI Academy →</a>
    </div>
  `)

  // Send in batches of 50 to avoid timeouts
  const batchSize = 50
  for (let i = 0; i < to.length; i += batchSize) {
    const batch = to.slice(i, i + batchSize)
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'SCSI Academy <onboarding@resend.dev>',
        bcc: batch,
        subject,
        html,
      })
    } catch (err) {
      console.error(`[Broadcast batch ${i}]`, err)
    }
  }
  console.log(`[BROADCAST SENT] "${subject}" → ${to.length} recipients`)
}