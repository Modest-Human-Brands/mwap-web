import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createPinia, setActivePinia } from 'pinia'

import type { SiteCard } from '@/domain/site'

const rows: [string, string, SiteCard['status']][] = [
  ['a', 'Alpha', 'draft'],
  ['b', 'Beta', 'published'],
  ['c', 'Gamma', 'published'],
]
const cards: SiteCard[] = rows.map(([slug, name, status], i) => ({
  slug,
  orgId: 'default',
  templateId: 'studio-v1',
  name,
  updatedAt: '2026-10-01T00:00:00.000Z',
  index: i + 1,
  category: 'Portfolio',
  status,
  description: '',
  pages: 1,
  collaborators: [],
}))

vi.mock('@/api/dashboard', () => ({
  listSiteCards: vi.fn<() => Promise<SiteCard[]>>(async () => structuredClone(cards)),
}))

import { useSitesStore } from '../sites'

describe('sites store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('groups sites into the four columns', async () => {
    const store = useSitesStore()
    await store.load()
    expect(store.columns.map((c) => [c.status, c.sites.length])).toEqual([
      ['draft', 1],
      ['ready', 0],
      ['published', 2],
      ['archived', 0],
    ])
  })

  it('filters by the search text', async () => {
    const store = useSitesStore()
    await store.load()
    store.search = 'gam'
    expect(store.filtered.map((s) => s.slug)).toEqual(['c'])
  })

  it('moves a site to Archived', async () => {
    const store = useSitesStore()
    await store.load()
    store.setStatus('a', 'archived')
    expect(store.columns.find((c) => c.status === 'archived')!.sites.map((s) => s.slug)).toEqual([
      'a',
    ])
  })

  it('reports a load error', async () => {
    const { listSiteCards } = await import('@/api/dashboard')
    vi.mocked(listSiteCards).mockRejectedValueOnce(new Error('down'))
    const store = useSitesStore()
    await store.load()
    expect(store.error).toBe('Could not reach the MWap service')
    expect(store.loaded).toBe(false)
  })
})