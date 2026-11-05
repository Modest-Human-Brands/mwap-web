import { useScriptTag } from '@vueuse/core'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export interface UseGoogleAnalyticsOptions {
  /** Google Analytics Measurement ID (e.g. 'G-XXXXXXXXXX') */
  measurementId?: string
  /** Enable script injection during local development (default: false) */
  enableInDev?: boolean
}

/**
 * Loads and initializes Google Analytics (gtag.js) dynamically using VueUse useScriptTag.
 */
export function useGoogleAnalytics(options: UseGoogleAnalyticsOptions = {}) {
  const measurementId =
    options.measurementId ?? (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)
  const enableInDev = options.enableInDev ?? false

  const shouldLoad = Boolean(measurementId && (!import.meta.env.DEV || enableInDev))

  if (shouldLoad && measurementId && typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
    window.gtag =
      window.gtag ||
      function (...args: unknown[]) {
        window.dataLayer?.push(args)
      }

    window.gtag('js', new Date())
    window.gtag('config', measurementId)
  }

  const { scriptTag, load, unload } = useScriptTag(
    shouldLoad && measurementId
      ? `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
      : '',
    () => {
      // Callback after script loaded
    },
    {
      async: true,
      defer: true,
      manual: !shouldLoad,
    },
  )

  const trackEvent = (eventName: string, eventParams?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams)
    }
  }

  return {
    scriptTag,
    load,
    unload,
    trackEvent,
    isConfigured: shouldLoad,
  }
}