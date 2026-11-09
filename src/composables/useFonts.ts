import { onScopeDispose, ref } from 'vue'

import { fontsApi, type FontSummary } from '@/api'
import { DEFAULT_FONT } from '@/domain/brand'

export const FALLBACK_FONTS: FontSummary[] = [
  { family: DEFAULT_FONT, name: DEFAULT_FONT.replace(/\s+/g, '') },
]

let featuredCache: FontSummary[] | null = null

export function resetFontCache(): void {
  featuredCache = null
}

/** Font search against the service, with a built-in list when it cannot be reached. */
export function useFonts() {
  const fonts = ref<FontSummary[]>(featuredCache ?? FALLBACK_FONTS)
  const loading = ref(false)
  const offline = ref(false)
  let controller: AbortController | undefined

  async function search(query = '') {
    const q = query.trim()
    if (q === '' && featuredCache) {
      fonts.value = featuredCache
      offline.value = false
      return
    }
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    try {
      const list = await fontsApi.list({ q: q || undefined, limit: 20 }, controller.signal)
      if (q === '') featuredCache = list
      fonts.value = list
      offline.value = false
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      fonts.value = FALLBACK_FONTS
      offline.value = true
    }
    loading.value = false
  }

  /** true: in the library; false: not found; null: could not check (offline). */
  async function isKnown(family: string): Promise<boolean | null> {
    if (family === DEFAULT_FONT) return true
    if (featuredCache?.some((f) => f.family.toLowerCase() === family.toLowerCase())) return true
    try {
      const found = await fontsApi.list({ q: family, limit: 20 })
      return found.some((f) => f.family.toLowerCase() === family.toLowerCase())
    } catch {
      return null
    }
  }

  onScopeDispose(() => controller?.abort())

  return { fonts, loading, offline, search, isKnown }
}