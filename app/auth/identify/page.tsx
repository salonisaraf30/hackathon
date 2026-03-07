'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

export default function IdentifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const next = searchParams.get('next') ?? '/dashboard'
    const uid = searchParams.get('uid')
    const email = searchParams.get('email')
    const created_at = searchParams.get('created_at')

    // Identify the user in PostHog so all future events
    // (digest_viewed, signal_clicked, etc.) are tied to their profile
    if (uid) {
      posthog.identify(uid, { email, created_at })
    }

    // Forward to the intended destination immediately
    router.replace(next)
  }, [])

  // Blank screen for the instant this page is visible
  return <div className="min-h-screen bg-black" />
}