import { config } from '@/config'
import type { SiteCard } from '@/domain/site'
import { getSiteMeta } from '@/mock/siteMeta'
import { sitesApi } from './sites'
import { templatesApi } from './templates'

/**
 * Sites for the board: real service data, with the fields the service lacks
 * (status, description, pages, collaborators) filled from mocks while VITE_USE_MOCKS is on.
 * Without mocks a stored site is live, so it is "published".
 */
export async function listSiteCards(signal?: AbortSignal): Promise<SiteCard[]> {
  const org = config.orgId === 'default' ? undefined : config.orgId
  const [{ results }, templates] = await Promise.all([
    sitesApi.list({ org, limit: 100 }, signal),
    templatesApi.list(signal).catch(() => []),
  ])
  const category = new Map(templates.map((t) => [t.id, t.category ?? t.label]))

  return results.map((site, i) => {
    const base = { ...site, index: i + 1, category: category.get(site.templateId) ?? 'Site' }
    if (!config.useMocks) {
      return { ...base, status: 'published', description: '', pages: 0, collaborators: [] }
    }
    return { ...base, ...getSiteMeta(site.slug, site.name) }
  })
}