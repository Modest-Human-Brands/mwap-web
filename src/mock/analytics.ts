/** Backend gap: the service has no analytics. Deterministic fake numbers, stable per site and range. */

export const RANGES = [7, 30, 90] as const
export type Range = (typeof RANGES)[number]

export interface Kpi {
  label: string
  value: number
  /** Change vs the previous period, in percent (visitors, page views) or absolute (enquiries). */
  delta: number
  unit: '%' | ''
}

export interface SiteAnalytics {
  kpis: Kpi[]
  daily: number[]
  topPages: [string, number][]
  sources: [string, number][]
}

function rng(seed: string) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const label = (key: string) => key.charAt(0).toUpperCase() + key.slice(1)
const SOURCES = ['Instagram', 'Direct', 'Search', 'YouTube', 'Other']

export function siteAnalytics(slug: string, range: Range, pages: string[]): SiteAnalytics {
  const rand = rng(`${slug}:${range}`)
  const base = 40 + Math.floor(rand() * 120)
  const daily = Array.from({ length: range }, (_, i) =>
    Math.round(base * (0.7 + rand() * 0.6) * (1 + i / (range * 3))),
  )
  const visitors = daily.reduce((a, b) => a + b, 0)
  const views = Math.round(visitors * (2.2 + rand()))
  const enquiries = Math.max(1, Math.round(visitors * (0.006 + rand() * 0.006)))

  const spread = (keys: string[], total: number): [string, number][] => {
    const weights = keys.map((_, i) => (keys.length - i) * (0.6 + rand() * 0.8))
    const sum = weights.reduce((a, b) => a + b, 0)
    return keys
      .map<[string, number]>((k, i) => [k, Math.round((total * weights[i]!) / sum)])
      .sort((a, b) => b[1] - a[1])
  }

  return {
    kpis: [
      { label: 'Visitors', value: visitors, delta: Math.round(rand() * 14), unit: '%' },
      { label: 'Page views', value: views, delta: Math.round(rand() * 12), unit: '%' },
      { label: 'Enquiries', value: enquiries, delta: Math.round(rand() * 6), unit: '' },
    ],
    daily,
    topPages: spread(pages.map(label), views),
    sources: spread(SOURCES, visitors).slice(0, 3),
  }
}

export interface ActivityEvent {
  title: string
  note: string
  when: string
}

export function siteActivity(templateLabel: string, published: boolean): ActivityEvent[] {
  return [
    ...(published
      ? [{ title: 'Site published', note: 'Published by Ayesha Rao', when: '2h ago' }]
      : []),
    { title: 'Details edited', note: 'Brand and headline updated', when: '1d ago' },
    { title: 'Site created', note: `${templateLabel} template`, when: '3d ago' },
  ]
}