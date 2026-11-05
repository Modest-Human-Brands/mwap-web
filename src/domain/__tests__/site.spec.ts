import { describe, expect, it } from 'vite-plus/test'

import { formatPages, matchesSearch, type SiteCard } from '../site'

const card: SiteCard = {
  slug: 'nova-marek',
  orgId: 'default',
  templateId: 'contact-sheet',
  name: 'Nova Marek',
  updatedAt: '2026-10-31T00:00:00.000Z',
  index: 1,
  category: 'Portfolio',
  status: 'published',
  description: 'Model portfolio',
  pages: 4,
  collaborators: [],
}

describe('formatPages', () => {
  it('pluralises', () => {
    expect(formatPages(1)).toBe('1 Page')
    expect(formatPages(4)).toBe('4 Pages')
  })
})

describe('matchesSearch', () => {
  it('matches everything for an empty query', () => {
    expect(matchesSearch(card, '  ')).toBe(true)
  })

  it.each(['nova', 'MAREK', 'model', 'portfolio'])('matches %s case-insensitively', (q) => {
    expect(matchesSearch(card, q)).toBe(true)
  })

  it('rejects an unrelated query', () => {
    expect(matchesSearch(card, 'zzz')).toBe(false)
  })
})