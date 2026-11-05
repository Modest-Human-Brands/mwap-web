import { describe, expect, it } from 'vite-plus/test'

import { overallAnalytics, siteActivity, siteAnalytics } from '../analytics'

describe('siteAnalytics', () => {
  it('is stable for the same site and range', () => {
    expect(siteAnalytics('a', 30, ['home'])).toEqual(siteAnalytics('a', 30, ['home']))
  })

  it('has one bar per day and visitors equal to their sum', () => {
    const a = siteAnalytics('a', 7, ['home'])
    expect(a.daily).toHaveLength(7)
    expect(a.kpis[0]!.value).toBe(a.daily.reduce((x, y) => x + y, 0))
  })

  it('ranks top pages in descending order and names them from the page keys', () => {
    const a = siteAnalytics('a', 30, ['home', 'projects', 'about'])
    expect(a.topPages.map(([name]) => name).sort()).toEqual(['About', 'Home', 'Work'])
    const values = a.topPages.map(([, v]) => v)
    expect(values).toEqual([...values].sort((x, y) => y - x))
  })
})

describe('overallAnalytics', () => {
  const sites = [
    { slug: 'a', name: 'A' },
    { slug: 'b', name: 'B' },
  ]

  it('sums the per-site visitors', () => {
    const all = overallAnalytics(sites, 30)
    const expected =
      siteAnalytics('a', 30, ['home']).kpis[0]!.value +
      siteAnalytics('b', 30, ['home']).kpis[0]!.value
    expect(all.kpis[0]!.value).toBe(expected)
    expect(all.topSites).toHaveLength(2)
  })

  it('has devices that add up to 100%', () => {
    const total = overallAnalytics(sites, 7).devices.reduce((t, [, v]) => t + v, 0)
    expect(total).toBe(100)
  })

  it('returns zeros without sites', () => {
    const all = overallAnalytics([], 30)
    expect(all.kpis.map((k) => k.value)).toEqual([0, 0, 0])
  })
})

describe('siteActivity', () => {
  it('only lists "Site published" for published sites', () => {
    expect(siteActivity('Studio', true).map((e) => e.title)).toContain('Site published')
    expect(siteActivity('Studio', false).map((e) => e.title)).not.toContain('Site published')
  })
})