'use client'
import HeroSection from '@/components/sections/HeroSection'
import StatsSection from '@/components/sections/StatsSection'
import PhilosophySection from '@/components/sections/PhilosophySection'
import ServicesPreview from '@/components/sections/ServicesPreview'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import RefineryBanner from '@/components/sections/RefineryBanner'
export default function HomePage() {
  return (
    <>
      <HeroSection/>
      <StatsSection/>
      <PhilosophySection/>
      <ServicesPreview/>
      <TestimonialsSection/>
      <RefineryBanner/>
    </>
  )
}
