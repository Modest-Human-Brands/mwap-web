import { describe, expect, it } from 'vite-plus/test'

import { buildCatalog, categoriesOf } from '../templates'

const summary = (id: string, label: string, category: string) => ({
  id,
  label,
  shortLabel: label,
  category,
  description: '',
})
const real = [
  summary('contact-sheet', 'Contact Sheet', 'Portfolios'),
  summary('psychiatrist-editorial', 'Editorial', 'Psychiatrists'),
]

describe('buildCatalog', () => {
  it('lists exactly the templates of the service, in its order', () => {
    const catalog = buildCatalog(real)
    expect(catalog.map((t) => t.id)).toEqual(['contact-sheet', 'psychiatrist-editorial'])
    expect(catalog[0]).toMatchObject({ label: 'Contact Sheet', backendId: 'contact-sheet' })
  })
})

describe('categoriesOf', () => {
  it('lists the service category names in order of first appearance', () => {
    expect(categoriesOf(buildCatalog(real))).toEqual(['Portfolios', 'Psychiatrists'])
  })
})