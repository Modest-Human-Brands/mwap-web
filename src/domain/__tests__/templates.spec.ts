import { describe, expect, it } from 'vite-plus/test'

import { buildCatalog } from '../templates'

const real = [
  { id: 'studio-v1', label: 'Studio', shortLabel: 'Studio', category: 'Studios', description: '' },
]

describe('buildCatalog', () => {
  it('adds the design templates as mocks rendered through the real template', () => {
    const catalog = buildCatalog(real)
    expect(catalog).toHaveLength(7)
    const mocks = catalog.filter((t) => t.mock)
    expect(mocks).toHaveLength(6)
    expect(mocks.every((t) => t.backendId === 'studio-v1')).toBe(true)
  })

  it('shows the real studio template as "Studio site"', () => {
    const studio = buildCatalog(real).find((t) => !t.mock)
    expect(studio).toMatchObject({ id: 'studio-v1', label: 'Studio site', category: 'Brand site' })
  })

  it('counts three portfolios, two landing pages and two brand sites', () => {
    const counts: Record<string, number> = {}
    for (const t of buildCatalog(real)) counts[t.category] = (counts[t.category] ?? 0) + 1
    expect(counts).toEqual({ Portfolio: 3, 'Landing page': 2, 'Brand site': 2 })
  })
})