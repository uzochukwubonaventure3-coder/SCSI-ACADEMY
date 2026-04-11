'use client'

const sections = [
  { title: 'Information We Collect', body: `We collect information you provide directly to us, such as when you create an account, subscribe to our content, fill out a contact form, or register for the Refinery mentorship program. This includes your name, email address, phone number, and payment information processed securely through Paystack. We do not store your card details on our servers.` },
  { title: 'How We Use Your Information', body: `We use the information we collect to: deliver content and services you subscribe to; send you transactional emails including payment receipts and access confirmations; respond to your inquiries and support requests; send you the weekly Mindset Audit newsletter (if you subscribed); improve our platform and content; and comply with legal obligations.` },
  { title: 'Confidentiality of Counseling Interactions', body: `SCSI Academy is operated by a professional counselor. All information shared in counseling sessions, contact forms, and mentorship registrations is treated with the strictest professional confidentiality. We will not disclose your personal information or session details to any third party without your explicit consent, except where required by law.` },
  { title: 'Payment Security', body: `All payments are processed through Paystack, a PCI-DSS compliant payment processor. We never see or store your full card details. Paystack's security practices are governed by their own privacy policy. We store only the transaction reference and amount for our records.` },
  { title: 'Cookies', body: `We use essential cookies to keep you logged in and remember your theme preference. We use analytics cookies to understand how visitors use our site. You can control cookie preferences through the banner displayed on your first visit. Declining analytics cookies does not affect your ability to use the site.` },
  { title: 'Data Sharing', body: `We do not sell, rent, or trade your personal information. We may share data with trusted service providers (such as Cloudinary for image hosting and Railway for server infrastructure) strictly to operate our platform. These providers are contractually bound to protect your data.` },
  { title: 'Data Retention', body: `We retain your account and subscription data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where we are legally required to retain it.` },
  { title: 'Your Rights', body: `You have the right to access the personal data we hold about you, request correction of inaccurate data, request deletion of your account and associated data, and opt out of marketing emails at any time using the unsubscribe link. To exercise these rights, contact us at preciouseze156@gmail.com.` },
  { title: 'Contact', body: `If you have questions about this Privacy Policy, please contact: Eze Tochukwu Precious, SCSI Academy — preciouseze156@gmail.com — +234 901 805 3015.` },
]

export default function PrivacyPage() {
  return (
    <>
      <section className="page-top">
        <div className="wrap">
          <p className="eyebrow">Legal</p>
          <h1 className="h-serif" style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:700, marginBottom:'0.875rem' }}>
            Privacy Policy
          </h1>
          <p style={{ color:'var(--txt-2)', fontSize:'0.9375rem', lineHeight:1.75 }}>
            Last updated: January 2026 · SCSI Academy takes your privacy seriously.
          </p>
        </div>
      </section>

      <section className="section" style={{ background:'var(--bg-0)' }}>
        <div className="wrap-sm">
          <div style={{ display:'flex', flexDirection:'column', gap:'2.5rem' }}>
            {sections.map((s, i) => (
              <div key={s.title} style={{ paddingBottom:'2.5rem', borderBottom: i < sections.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <h2 className="h-serif" style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--txt-1)', marginBottom:'1rem' }}>
                  <span style={{ color:'var(--gold)', marginRight:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:700 }}>{String(i+1).padStart(2,'0')}.</span>
                  {s.title}
                </h2>
                <p style={{ fontSize:'0.9375rem', color:'var(--txt-2)', lineHeight:1.9 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
