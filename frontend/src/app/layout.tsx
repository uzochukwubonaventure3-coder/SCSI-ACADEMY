import type { Metadata } from 'next'
import { Libre_Baskerville, DM_Sans } from 'next/font/google'
import '@/styles/globals.css'
import { ThemeProvider }  from '@/hooks/useTheme'
import { AccessProvider } from '@/hooks/useAccess'
import { ToastProvider }  from '@/components/ui/Toast'
import ClientShell        from '@/components/layout/ClientShell'

const serif = Libre_Baskerville({
  subsets: ['latin'], variable: '--font-serif',
  weight: ['400','700'], style: ['normal','italic'], display: 'swap',
})
const sans = DM_Sans({
  subsets: ['latin'], variable: '--font-sans',
  weight: ['300','400','500','600','700'], display: 'swap',
})

export const metadata: Metadata = {
  title:       { default: 'SCSI Academy — Engineering Balanced Giants', template: '%s | SCSI Academy' },
  description: 'Student Counseling Services International. Mindset Engineering & Strategic Counseling for the next generation of leaders.',
  keywords:    ['SCSI Academy','mindset coaching Nigeria','student counseling','Eze Tochukwu Precious'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://scsi-academy.vercel.app'),
  openGraph: {
    title: 'SCSI Academy — Engineering Balanced Giants',
    description: 'Mindset Engineering & Strategic Counseling for the next generation of leaders.',
    siteName: 'SCSI Academy', locale: 'en_NG', type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'SCSI Academy' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${serif.variable} ${sans.variable}`}>
        <ThemeProvider>
          <AccessProvider>
            <ToastProvider>
              <ClientShell>{children}</ClientShell>
            </ToastProvider>
          </AccessProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
