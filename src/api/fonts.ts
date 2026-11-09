import { request } from './http'
import type { FontSummary } from './types'

export const fontsApi = {
  /** Featured families without `q`, otherwise a search by name (Google Fonts). Public, no key. */
  list: (query: { q?: string; limit?: number } = {}, signal?: AbortSignal) =>
    request<FontSummary[]>('/fonts', { query, signal }),
}