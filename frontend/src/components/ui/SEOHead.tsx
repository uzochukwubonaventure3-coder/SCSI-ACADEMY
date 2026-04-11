import Head from 'next/head'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://scsi-academy.vercel.app'
const DEFAULT_IMG = `${SITE}/og-image.jpg`

export default function SEOHead({ title, description, image, url, type = 'website' }: SEOProps) {
  const fullTitle = title ? `${title} | SCSI Academy` : 'SCSI Academy — Engineering Balanced Giants'
  const desc = description || 'Student Counseling Services International. Mindset Engineering & Strategic Counseling for the next generation of leaders.'
  const img  = image || DEFAULT_IMG
  const canonical = url ? `${SITE}${url}` : SITE

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image"       content={img} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:type"        content={type} />
      <meta property="og:site_name"   content="SCSI Academy" />
      <meta property="og:locale"      content="en_NG" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={img} />

      {/* Extra */}
      <meta name="theme-color" content="#080506" />
      <link rel="sitemap" type="application/xml" href={`${process.env.NEXT_PUBLIC_API_URL}/sitemap.xml`} />
    </Head>
  )
}
