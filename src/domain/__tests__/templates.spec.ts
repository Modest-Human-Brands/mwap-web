import { describe, expect, it } from 'vite-plus/test'

import { buildCatalog, categoriesOf } from '../templates'

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

  it('keeps the service category names and groups the mocks under plural ones', () => {
    const catalog = buildCatalog(real)
    expect(catalog[0]!.category).toBe('Portfolios')
    expect(categoriesOf(catalog)).toEqual(['Portfolios', 'Landing pages', 'Brand sites'])
  })

  it('adds a category for each new template of the service', () => {
    const editorial = {
      id: 'psychiatrist-editorial',
      label: 'Editorial',
      shortLabel: 'Editorial',
      category: 'Psychiatrists',
      description: '',
    }
    expect(categoriesOf(buildCatalog([...real, editorial]))).toContain('Psychiatrists')
  })

  it('counts three portfolios, two landing pages and one brand site', () => {
    const counts: Record<string, number> = {}
    for (const t of buildCatalog(real)) counts[t.category] = (counts[t.category] ?? 0) + 1
    expect(counts).toEqual({ Portfolios: 3, 'Landing pages': 2, 'Brand sites': 1 })
  })
})