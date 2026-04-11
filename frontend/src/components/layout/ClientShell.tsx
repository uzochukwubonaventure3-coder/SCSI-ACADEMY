'use client'
import { usePathname } from 'next/navigation'
import Navbar        from './Navbar'
import Footer        from './Footer'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import CookieBanner   from '@/components/ui/CookieBanner'

// Pages with NO navbar and NO footer (full-screen standalone pages)
const BARE_PAGES = ['/admin']

// Pages with navbar but NO footer (auth/functional pages)
const NO_FOOTER_PAGES = [
  '/login', '/signup', '/forgot-password', '/reset-password',
  '/verify-email', '/settings', '/notifications',
]

// Pages with no WhatsApp button
const NO_WA_PAGES = ['/admin', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()

  const isBare     = BARE_PAGES.some(p => path.startsWith(p))
  const noFooter   = isBare || NO_FOOTER_PAGES.some(p => path.startsWith(p))
  const noWhatsApp = NO_WA_PAGES.some(p => path.startsWith(p))

  if (isBare) {
    return (
      <main style={{ minHeight: '100vh' }}>
        {children}
      </main>
    )
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh' }}>{children}</main>
      {!noFooter && <Footer />}
      {!noWhatsApp && <WhatsAppButton />}
      <CookieBanner />
    </>
  )
}
