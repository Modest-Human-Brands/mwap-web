import { request } from './http'
import type { Page, Site, SiteInput, SiteSummary } from './types'

const sitePath = (slug: string) => `/site/${encodeURIComponent(slug)}`

export const sitesApi = {
  list: (params: { org?: string; limit?: number; offset?: number } = {}, signal?: AbortSignal) =>
    request<Page<SiteSummary>>('/site', { query: params, signal }),

  get: (slug: string, signal?: AbortSignal) => request<Site>(sitePath(slug), { signal }),

  create: (body: SiteInput, signal?: AbortSignal) =>
    request<Site>('/site', { method: 'POST', body, write: true, signal }),

  replace: (slug: string, body: SiteInput, signal?: AbortSignal) =>
    request<Site>(sitePath(slug), { method: 'PUT', body, write: true, signal }),
}