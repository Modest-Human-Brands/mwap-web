import { SITE_STATUSES, type Collaborator, type SiteStatus } from '@/domain/site'

/** Backend gap: sites have no status, description, page count or collaborators. */
export interface SiteMeta {
  status: SiteStatus
  description: string
  pages: number
  collaborators: Collaborator[]
}

const STORAGE_KEY = 'mwap:mock:site-meta'

const seeded: Record<string, SiteMeta> = {}

function load(): Record<string, SiteMeta> {
  try {
    return { ...seeded, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  } catch {
    return { ...seeded }
  }
}

let store = load()

/** Stable pseudo-status so unknown sites spread over the board instead of piling in one column. */
function fallback(slug: string, name: string): SiteMeta {
  const hash = Array.from(slug, (ch) => ch.charCodeAt(0)).reduce((sum, code) => sum + code, 0)
  const status = SITE_STATUSES[hash % SITE_STATUSES.length]!
  return {
    status,
    description: `Site for ${name}.`,
    // The service lists sites without their pages; its one template is single-page.
    pages: 1,
    collaborators: [{ initial: 'R' }, { initial: 'A' }],
  }
}

export function getSiteMeta(slug: string, name: string): SiteMeta {
  return store[slug] ?? fallback(slug, name)
}

export function setSiteMeta(slug: string, patch: Partial<SiteMeta>, name = slug) {
  store = { ...store, [slug]: { ...getSiteMeta(slug, name), ...patch } }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}