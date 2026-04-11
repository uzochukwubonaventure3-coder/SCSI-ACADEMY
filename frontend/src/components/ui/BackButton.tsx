'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton({ label = 'Go Back' }: { label?: string }) {
  const router = useRouter()
  return (
    <button onClick={() => router.back()} className="back-btn">
      <ArrowLeft size={13} />
      {label}
    </button>
  )
}
