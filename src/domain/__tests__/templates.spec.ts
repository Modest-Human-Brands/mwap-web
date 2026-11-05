import { describe, expect, it } from 'vite-plus/test'

import { buildCatalog, categoryFor } from '../templates'

const real = [
  {
    id: 'contact-sheet',
    label: 'Contact Sheet',
    shortLabel: 'Contact Sheet',
    category: 'Portfolios',
    description: '',
  },
]

describe('buildCatalog', () => {
  it('lists the real template first, then the design templates as mocks rendered through it', () => {
    const catalog = buildCatalog(real)
    expect(catalog).toHaveLength(6)
    expect(catalog[0]).toMatchObject({ id: 'contact-sheet', label: 'Contact Sheet', mock: false })
    const mocks = catalog.filter((t) => t.mock)
    expect(mocks).toHaveLength(5)
    expect(mocks.every((t) => t.backendId === 'contact-sheet')).toBe(true)
  })

  it('files the real template under the singular design category', () => {
    expect(buildCatalog(real)[0]!.category).toBe('Portfolio')
    expect(categoryFor('Landing pages')).toBe('Landing page')
    expect(categoryFor(null)).toBe('Brand site')
  })

  it('counts three portfolios, two landing pages and one brand site', () => {
    const counts: Record<string, number> = {}
    for (const t of buildCatalog(real)) counts[t.category] = (counts[t.category] ?? 0) + 1
    expect(counts).toEqual({ Portfolio: 3, 'Landing page': 2, 'Brand site': 1 })
  })
})