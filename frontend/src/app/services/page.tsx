'use client'
import Link from 'next/link'
import { useState } from 'react'
import {
  Brain, GraduationCap, Mic, Users, Briefcase, Heart,
  CheckCircle, ArrowRight, Crown, Zap, Star, Shield,
  Clock, MessageCircle
} from 'lucide-react'

// ── Coaching plans ────────────────────────────────────────────────────
const plans = [
  {
    id: 'academy',
    name: 'SCSI Mentorship Academy',
    price: 15000,
    duration: '2 Months',
    tag: null,
    savingsBadge: null,
    target: 'Those looking for community, structure, and foundational growth.',
    icon: <Users size={24}/>,
    accentColor: '#5B5BD6',
    features: [
      { title: 'The Blueprint for Growth', body: 'Step-by-step curriculum designed to move you from confusion to a clear, actionable life vision.' },
      { title: 'Power of Community', body: 'Join a circle of high-achievers who provide the accountability and support you have been missing.' },
      { title: 'Direct Access to Coach Precious', body: 'Weekly group coaching sessions where your specific questions get professional, mindset-shifting answers.' },
      { title: 'Resource Library', body: 'Immediate access to exclusive worksheets, recordings, and tools you can keep and use for a lifetime.' },
      { title: 'The "Academy Edge"', body: 'A certificate of completion that marks your transition from a mediocre mindset to a strategic thinker.' },
    ],
  },
  {
    id: '1on1-monthly',
    name: 'One-on-One Mentorship',
    price: 15000,
    duration: '1 Month',
    tag: 'Deep Dive',
    savingsBadge: null,
    target: 'The "Deep Dive" starter — someone who needs immediate, personalized focus.',
    icon: <Brain size={24}/>,
    accentColor: '#C9A24B',
    features: [
      { title: 'Personalized Life Audit', body: 'We tear down your current habits and rebuild a custom daily routine that actually serves your goals.' },
      { title: '100% Focused Attention', body: 'No crowds. A private safe space to discuss deep-seated issues that are holding you back.' },
      { title: 'Rapid Problem Solving', body: 'Got a specific crisis? We use this month to tackle your biggest current obstacle and provide an immediate solution.' },
      { title: 'Weekly Action Plans', body: 'Receive a personalized homework sheet every week to ensure you are executing, not just talking.' },
      { title: 'The Confidence Boost', body: 'Experience an immediate shift in self-worth that will make you show up differently in your career and relationships.' },
    ],
  },
  {
    id: '1on1-3months',
    name: 'One-on-One Coaching',
    price: 40000,
    duration: '3 Months',
    tag: 'Consistency',
    savingsBadge: 'Save ₦5,000',
    target: 'The "Consistency" seeker — someone ready for real habit transformation.',
    icon: <Zap size={24}/>,
    accentColor: '#50c880',
    features: [
      { title: 'Subconscious Reengineering', body: 'Three months is where we actually rewire your brain for long-term success — not just a start.' },
      { title: 'Mid-Point Evaluation', body: 'A comprehensive review at week 6 to measure progress and pivot your strategy for maximum results.' },
      { title: 'Crisis Management Support', body: 'On-demand guidance via chat for those moments when life happens and you need a coach\'s perspective now.' },
      { title: 'Relationship & Career Alignment', body: 'We ensure your internal growth is reflecting in your external success and income.' },
      { title: 'The Habit Lock', body: 'By day 90, your new high-performance habits will be on autopilot — no more struggling to stay disciplined.' },
    ],
  },
  {
    id: '1on1-6months',
    name: 'One-on-One Coaching',
    price: 60000,
    duration: '6 Months',
    tag: 'Legacy Builder',
    savingsBadge: 'BEST VALUE — Save 33%',
    isBestValue: true,
    target: 'The "Legacy" builder — total life transformation and architectural mastery.',
    icon: <Crown size={24}/>,
    accentColor: '#E89B1A',
    features: [
      { title: 'Total Identity Shift', body: 'This is a rebirth. Six months ensuring the "old you" is completely replaced by a visionary leader.' },
      { title: 'Architectural Life Planning', body: 'We build a 2-year and 5-year roadmap for your business, career, and personal life with professional precision.' },
      { title: 'Elite VIP Access', body: 'Priority scheduling and first-look access to all new SCSI programs, events, and materials before the public.' },
      { title: 'The Parenting Repair', body: 'Extended time to deeply heal from incorrect parenting, ensuring you don\'t pass those patterns forward.' },
      { title: 'Permanent Mastery', body: 'At this level, you don\'t just learn — you become a master of your own mind. You will be unrecognizable.' },
    ],
  },
]

// ── Core services (original 6) ────────────────────────────────────────
const services = [
  { id:'mindset',   icon:<Brain size={24}/>,         tag:'Most Intensive', title:'One-on-One Mindset Engineering',          sub:'Private Coaching',        body:`This is our most intensive service. As your Coach, I sit with you to perform a \"Surgical Audit\" of your current life, habits, and goals. We identify the \"Operational Blindness\" slowing you down and build a custom map for your success.`,  bestFor:'Individuals ready for a total life reset and personalized accountability.', outcome:'A clear, written strategy and the discipline to execute it.' },
  { id:'academic',  icon:<GraduationCap size={24}/>, tag:null,             title:'Academic & Career Counseling',            sub:'Career Bridging',         body:`We bridge the gap between being a \"Student\" and becoming a \"Professional.\" We help you understand the true value of your certification while building the soft skills — like discipline and time management — that the classroom doesn't teach.`,   bestFor:'400-level students and recent graduates preparing for the global stage.', outcome:'Clarity on your career path and a mindset built for the marketplace.' },
  { id:'speaking',  icon:<Mic size={24}/>,           tag:null,             title:'Public Speaking & Communication Mastery',  sub:'Voice & Influence',      body:`Your voice is your greatest tool, but only if it is trained. We coach you on the art of the \"Hook,\" the \"Message,\" and the \"Call to Action.\" We help you move from being "heard" to being "influential."`,  bestFor:'Aspiring public speakers, student leaders, and content creators.', outcome:'The ability to speak with authority and command any room or lens.' },
  { id:'workshops', icon:<Users size={24}/>,         tag:'Group Sessions',  title:'SCSI Leadership Workshops',               sub:'Organizational Training', body:`These are group sessions designed for student organizations and campus brands. We cover high-impact topics such as The Value of Certification, The Busy Trap, and The Architecture of Achievement.`, bestFor:'Universities, student groups, and youth organizations.', outcome:'A collective shift in mindset from "student" to "global giant."' },
  { id:'branding',  icon:<Briefcase size={24}/>,     tag:null,             title:'Professional Branding & Positioning',      sub:'Digital Authority',       body:`We help you audit your digital presence, specifically on LinkedIn and Facebook. We ensure that your "About" section, your headlines, and your content reflect the authority of a leader rather than the confusion of a wanderer.`, bestFor:'Students and young entrepreneurs looking to attract high-level clients or employers.', outcome:'A professional digital identity that commands respect.' },
  { id:'healing',   icon:<Heart size={24}/>,         tag:'Confidential',   title:'Trauma Recovery & Emotional Healing',     sub:'Safe Space Counseling',   body:`The weight of the past can be the heaviest anchor holding a student back. At SCSI, we provide a safe, confidential "Refinery" for those who have walked through traumatic experiences. We walk with you through the process of deconstructing the pain and rebuilding your inner strength.`, bestFor:'Students and young leaders who feel "stuck" due to past wounds, grief, or traumatic setbacks.', outcome:'A journey toward emotional wholeness, restored confidence, and mental freedom.' },
]

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'services'>('plans')

  return (
    <>
      {/* ── Hero ── */}
      <section className="page-top" style={{ paddingTop: '7.5rem' }}>
        <div className="wrap">
          <p className="eyebrow">Our Services</p>
          <h1 className="h-serif" style={{ fontSize: 'clamp(2rem,5vw,3.25rem)', fontWeight: 700, marginBottom: '0.875rem' }}>
            Engineering the <span className="grad-text">Giant Within</span>
          </h1>
          <p style={{ color: 'var(--txt-2)', fontSize: '1rem', lineHeight: 1.8, maxWidth: '520px', marginBottom: '2rem' }}>
            At SCSI Academy, we don't provide "advice"; we provide Architectural Solutions — precision-engineered to move you from effort to results.
          </p>

          {/* Tab selector */}
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.375rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '12px', width: 'fit-content' }}>
            {[
              { id: 'plans', label: '💼 Coaching Plans & Pricing' },
              { id: 'services', label: '🔧 All Services' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as 'plans' | 'services')}
                style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none', background: activeTab === tab.id ? 'var(--gold)' : 'transparent', color: activeTab === tab.id ? '#080506' : 'var(--txt-2)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: activeTab === tab.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── COACHING PLANS ── */}
      {activeTab === 'plans' && (
        <section className="section" style={{ background: 'var(--bg-0)' }}>
          <div className="wrap">
            {/* Section header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p className="eyebrow">Choose Your Path</p>
              <h2 className="h-serif" style={{ fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
                Mentorship & Coaching Plans
              </h2>
              <p style={{ color: 'var(--txt-2)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.8 }}>
                Every journey is different. Choose the plan that matches your level of commitment and desired transformation.
              </p>
            </div>

            {/* Plans grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
              {plans.map((plan) => (
                <div key={plan.id}
                  style={{ background: 'var(--bg-2)', border: `2px solid ${(plan as { isBestValue?: boolean }).isBestValue ? plan.accentColor + '55' : 'var(--border)'}`, borderRadius: '20px', overflow: 'hidden', position: 'relative', transition: 'transform 0.25s, box-shadow 0.25s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>

                  {/* Best Value badge */}
                  {(plan as { isBestValue?: boolean }).isBestValue && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '0.5rem', background: plan.accentColor, textAlign: 'center' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#080506', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        ⭐ BEST VALUE — Save 33%
                      </span>
                    </div>
                  )}

                  <div style={{ padding: (plan as { isBestValue?: boolean }).isBestValue ? '3.25rem 1.625rem 1.625rem' : '1.625rem' }}>
                    {/* Icon + tag */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.125rem' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: plan.accentColor + '18', border: `1px solid ${plan.accentColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: plan.accentColor }}>
                        {plan.icon}
                      </div>
                      {plan.tag && (
                        <span style={{ padding: '0.2rem 0.625rem', borderRadius: '99px', background: plan.accentColor + '18', border: `1px solid ${plan.accentColor}33`, fontSize: '0.65rem', fontWeight: 700, color: plan.accentColor, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          {plan.tag}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="h-serif" style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--txt-1)' }}>
                      {plan.name}
                    </h3>

                    {/* Duration */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.25rem' }}>
                      <Clock size={13} color="var(--txt-3)"/>
                      <span style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>{plan.duration}</span>
                    </div>

                    {/* Price */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', fontWeight: 800, color: plan.accentColor, lineHeight: 1 }}>
                          {naira(plan.price)}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--txt-3)' }}>/ {plan.duration.toLowerCase()}</span>
                      </div>
                      {plan.savingsBadge && !(plan as { isBestValue?: boolean }).isBestValue && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.375rem', padding: '0.2rem 0.625rem', borderRadius: '99px', background: 'rgba(80,200,128,0.1)', border: '1px solid rgba(80,200,128,0.3)' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#50c880' }}>✓ {plan.savingsBadge}</span>
                        </div>
                      )}
                    </div>

                    {/* Target */}
                    <p style={{ fontSize: '0.82rem', color: 'var(--txt-3)', lineHeight: 1.6, marginBottom: '1.375rem', fontStyle: 'italic' }}>
                      {plan.target}
                    </p>

                    {/* Features */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.625rem' }}>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: plan.accentColor + '18', border: `1px solid ${plan.accentColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                            <CheckCircle size={11} color={plan.accentColor}/>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '0.125rem' }}>{f.title}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--txt-3)', lineHeight: 1.55 }}>{f.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CTA — two buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {/* Primary: Pay now → redirects to signup with plan pre-selected */}
                      <a
                        href={`/signup?plan=${plan.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                          padding: '0.9375rem', borderRadius: '12px',
                          background: plan.accentColor,
                          color: '#080506',
                          fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', fontWeight: 800,
                          textDecoration: 'none', transition: 'opacity 0.15s', width: '100%', boxSizing: 'border-box',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        Get Started — ₦{(plan.price / 100).toLocaleString()}
                      </a>
                      {/* Secondary: WhatsApp for questions */}
                      <a
                        href={`https://wa.me/2349018053015?text=${encodeURIComponent(`Hello Coach Precious! I am interested in the ${plan.name} (${plan.duration} — ${naira(plan.price)}) plan. I would like to get started.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                          padding: '0.75rem', borderRadius: '12px',
                          background: 'transparent', border: `1.5px solid ${plan.accentColor}55`,
                          color: plan.accentColor,
                          fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', fontWeight: 600,
                          textDecoration: 'none', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = plan.accentColor + '18' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Ask on WhatsApp first
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div style={{ textAlign: 'center', marginTop: '3.5rem', padding: '2.5rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '20px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid rgba(201,162,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <MessageCircle size={24} color="var(--gold)"/>
              </div>
              <h3 className="h-serif" style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.625rem' }}>
                Not sure which plan is right for you?
              </h3>
              <p style={{ color: 'var(--txt-2)', maxWidth: '400px', margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
                Send a message to Coach Precious on WhatsApp for a free 5-minute consultation. No pressure — just clarity.
              </p>
              <a
                href="https://wa.me/2349018053015?text=Hello%20Coach%20Precious!%20I%20need%20help%20choosing%20the%20right%20coaching%20plan%20for%20me."
                target="_blank" rel="noopener noreferrer"
                className="btn btn-gold" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Chat with Coach Precious
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── CORE SERVICES ── */}
      {activeTab === 'services' && (
        <section className="section" style={{ background: 'var(--bg-0)' }}>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {services.map((s, i) => (
              <div key={s.id} id={s.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', scrollMarginTop: '100px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: '0' }}>
                  {/* Left */}
                  <div style={{ padding: '2rem', background: i % 2 === 0 ? 'var(--bg-3)' : 'var(--bg-2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--gold-dim)', border: '1px solid rgba(201,162,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                          {s.icon}
                        </div>
                        {s.tag && <span className="badge">{s.tag}</span>}
                      </div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--txt-3)', marginBottom: '0.375rem' }}>{s.sub}</p>
                      <h2 className="h-serif" style={{ fontSize: 'clamp(1.125rem,2vw,1.5rem)', fontWeight: 700, lineHeight: 1.25, color: 'var(--txt-1)' }}>{s.title}</h2>
                    </div>
                    <a
                      href={`https://wa.me/2349018053015?text=${encodeURIComponent(`Hello Coach Precious! I am interested in ${s.title}.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
                      Book this Service <ArrowRight size={12}/>
                    </a>
                  </div>
                  {/* Right */}
                  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <p style={{ fontSize: '0.9375rem', color: 'var(--txt-2)', lineHeight: 1.85 }}>{s.body}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <CheckCircle size={15} color="var(--gold)" style={{ flexShrink: 0, marginTop: '3px' }}/>
                        <div>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>Best for: </span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--txt-2)' }}>{s.bestFor}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <Star size={15} color="var(--gold)" style={{ flexShrink: 0, marginTop: '3px' }}/>
                        <div>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>Outcome: </span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--txt-2)' }}>{s.outcome}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
