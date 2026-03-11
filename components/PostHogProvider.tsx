'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!posthogKey) {
      console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY is not set. PostHog tracking is disabled.')
      return
    }
    posthog.init(posthogKey, {
      api_host: 'https://app.posthog.com',
      capture_pageview: true,
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}