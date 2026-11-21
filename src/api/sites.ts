import { request } from './http'
import type { Page, Site, SiteInput, SiteSummary } from './types'

const sitePath = (slug: string) => `/site/${encodeURIComponent(slug)}`

export const sitesApi = {
  list: (params: { org?: string; limit?: number; offset?: number } = {}, signal?: AbortSignal) =>
    request<Page<SiteSummary>>('/site', { query: params, access: true, signal }),

  get: (slug: string, signal?: AbortSignal) =>
    request<Site>(sitePath(slug), { access: true, signal }),

  create: (body: SiteInput, signal?: AbortSignal) =>
    request<Site>('/site', { method: 'POST', body, access: true, signal }),

  replace: (slug: string, body: SiteInput, signal?: AbortSignal) =>
    request<Site>(sitePath(slug), { method: 'PUT', body, access: true, signal }),

  /** Deletes a site saved through the API (204). Built-in and Notion sites answer 409. */
  remove: (slug: string, signal?: AbortSignal) =>
    request<null>(sitePath(slug), { method: 'DELETE', access: true, signal }),
}