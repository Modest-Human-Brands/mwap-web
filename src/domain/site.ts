import { config } from '@/config'
import type { SiteSummary } from '@/api'

/** The board columns of the Sites screen. The backend has no status yet (mocked). */
export const SITE_STATUSES = ['draft', 'ready', 'published', 'archived'] as const
export type SiteStatus = (typeof SITE_STATUSES)[number]

export const STATUS_LABEL: Record<SiteStatus, string> = {
  draft: 'Draft',
  ready: 'Ready',
  published: 'Published',
  archived: 'Archived',
}

/** Badge and dot tones, as in the design (Archived keeps the info badge but a grey dot). */
export const STATUS_BADGE: Record<SiteStatus, string> = {
  draft: 'bg-info',
  ready: 'bg-success',
  published: 'bg-success',
  archived: 'bg-info',
}

export const STATUS_DOT: Record<SiteStatus, string> = {
  draft: 'bg-info',
  ready: 'bg-success',
  published: 'bg-success',
  archived: 'bg-grey',
}

export interface Collaborator {
  initial: string
}

/** What a card on the Sites board shows: real fields plus the mocked ones. */
export interface SiteCard extends SiteSummary {
  /** 1-based position in the list, shown as "#n". */
  index: number
  /** Template category, e.g. "Studios". */
  category: string
  status: SiteStatus
  description: string
  pages: number
  collaborators: Collaborator[]
}

export const formatPages = (n: number) => `${n} ${n === 1 ? 'Page' : 'Pages'}`

const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
export const formatDay = (iso: string) => dayMonth.format(new Date(iso))

/** Public URL of a published site. */
export const siteUrl = (slug: string) =>
  `${config.sitesBaseUrl || window.location.origin}/${encodeURIComponent(slug)}`

export function matchesSearch(site: SiteCard, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [site.name, site.slug, site.description, site.category].some((f) =>
    f.toLowerCase().includes(q),
  )
}