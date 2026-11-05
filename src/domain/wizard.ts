import type { Brand, Site, SiteData, SiteInput, Template } from '@/api'
import { config } from '@/config'

export interface SiteDetails {
  name: string
  slug: string
  logoUrl: string
  accent: string
  fontFamily: string
  /** Cover title (`pages.home.cover.title`). */
  headline: string
  /** Cover tagline (`pages.home.cover.tagline`). */
  bio: string
  /** Comp card stats, at most 3 (`pages.home.compCard.stats`). */
  stats: Stat[]
  /** Comp card measurements, 1 to 10 (`pages.home.compCard.measurements`). */
  measurements: Measurement[]
}

export interface Stat {
  value: string
  label: string
}
export interface Measurement {
  label: string
  value: string
}

export const MAX_STATS = 3
export const MAX_MEASUREMENTS = 10

export const SLUG_PATTERN = /^[a-z0-9-]+$/

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

/** Where a site is reached: `<slug>.<domain>` when a wildcard domain is configured, else `<host>/<slug>`. */
export function siteAddress(slug: string) {
  if (config.siteDomain) return `${slug}.${config.siteDomain}`
  const base = (config.sitesBaseUrl || window.location.origin).replace(/^https?:\/\//, '')
  return `${base}/${slug}`
}

type Rec = Record<string, unknown>
const rec = (v: unknown): Rec => (v && typeof v === 'object' ? (v as Rec) : {})

const text = (v: unknown) => (typeof v === 'string' ? v : '')
const list = <T extends Rec>(v: unknown, keys: (keyof T & string)[]): T[] =>
  Array.isArray(v)
    ? v.map((item) => Object.fromEntries(keys.map((k) => [k, text(rec(item)[k])])) as T)
    : []

/** The editable content of a `contact-sheet` payload: cover text plus the comp card lists. */
function readContent(data: SiteData) {
  const home = rec(rec(data.pages).home)
  const cover = rec(home.cover)
  const compCard = rec(home.compCard)
  return {
    headline: text(cover.title),
    bio: text(cover.tagline),
    stats: list<Rec & Stat>(compCard.stats, ['value', 'label']),
    measurements: list<Rec & Measurement>(compCard.measurements, ['label', 'value']),
  }
}

/** The edited content laid over a payload; everything else in it is kept as is. */
function writeContent(data: SiteData, d: SiteDetails): SiteData {
  const pages = rec(data.pages)
  const home = rec(pages.home)
  const compCard = rec(home.compCard)
  return {
    ...data,
    pages: {
      ...pages,
      home: {
        ...home,
        cover: { ...rec(home.cover), title: d.headline, tagline: d.bio },
        compCard: {
          ...compCard,
          stats: d.stats.map((s) => ({ ...s })),
          measurements: d.measurements.map((m) => ({ ...m })),
        },
      },
    },
  }
}

/** The service has no brand sample, so new sites start from this neutral one. */
export const DEFAULT_BRAND: Brand = {
  name: '',
  logoUrl: 'https://api.iconify.design/lucide/globe.svg?color=%236C3BFF&width=64&height=64',
  faviconUrl: 'https://api.iconify.design/lucide/globe.svg?color=%236C3BFF',
  fontFamily: 'Geist',
  colors: {
    primary: '#6C3BFF',
    secondary: '#98989F',
    accent: '#6C3BFF',
    background: '#0C0912',
    text: '#F8FAFC',
  },
}

/** Details form defaults, read from the template sample (the service's own placeholder content). */
export function defaultsFromTemplate(template: Template): SiteDetails {
  const brand = DEFAULT_BRAND
  return {
    name: brand.name,
    slug: slugify(brand.name),
    logoUrl: brand.logoUrl,
    accent: brand.colors.accent,
    fontFamily: brand.fontFamily,
    ...readContent(template.sample),
  }
}

/** Page keys of the template (home…), for the preview rail. */
export const templatePages = (template: Template) => Object.keys(rec(template.sample.pages))

export function buildBrand(_template: Template, d: SiteDetails): Brand {
  const brand = DEFAULT_BRAND
  return {
    ...brand,
    // The service rejects an empty name, so the live preview shows a placeholder until one is typed.
    name: d.name.trim() || 'Your site',
    logoUrl: d.logoUrl,
    fontFamily: d.fontFamily,
    colors: { ...brand.colors, primary: d.accent, accent: d.accent },
  }
}

/** The template sample with the form's content laid over it, so the payload is always complete. */
export function buildData(template: Template, d: SiteDetails): SiteData {
  return writeContent(template.sample, d)
}

export function buildSiteInput(template: Template, d: SiteDetails): SiteInput {
  return {
    slug: d.slug,
    templateId: template.id,
    brand: buildBrand(template, d),
    data: buildData(template, d),
    ...(config.siteDomain ? { domains: [`${d.slug}.${config.siteDomain}`] } : {}),
  }
}

export type DetailsErrors = Partial<Record<keyof SiteDetails, string>>

export function validateDetails(d: SiteDetails): DetailsErrors {
  const errors: DetailsErrors = {}
  if (!d.name.trim()) errors.name = 'Enter a site name'
  if (!d.slug) errors.slug = 'Enter a site address'
  else if (!SLUG_PATTERN.test(d.slug)) errors.slug = 'Use lowercase letters, numbers and dashes'
  if (!d.headline.trim()) errors.headline = 'Enter a headline'
  if (!d.bio.trim()) errors.bio = 'Enter a short bio'
  if (!d.measurements.length) errors.measurements = 'Add at least one measurement'
  else if (d.measurements.some((m) => !m.label.trim() || !m.value.trim()))
    errors.measurements = 'Fill in every measurement'
  if (d.stats.some((st) => !st.label.trim() || !st.value.trim()))
    errors.stats = 'Fill in every stat'
  return errors
}

/** Maps service field paths (brand.name, slug, domains.0…) to form fields. */
export function fieldForServiceError(field: string): keyof SiteDetails | undefined {
  if (field === 'slug' || field.startsWith('domains')) return 'slug'
  if (field === 'brand.name') return 'name'
  if (field === 'brand.logoUrl') return 'logoUrl'
  if (field === 'brand.fontFamily') return 'fontFamily'
  if (field.startsWith('brand.colors')) return 'accent'
  if (field.endsWith('cover.title')) return 'headline'
  if (field.endsWith('cover.tagline')) return 'bio'
  if (field.includes('compCard.measurements')) return 'measurements'
  if (field.includes('compCard.stats')) return 'stats'
  return undefined
}

/** Form values of an existing site (edit screen). */
export function detailsFromSite(site: Site): SiteDetails {
  return {
    name: site.brand.name,
    slug: site.slug,
    logoUrl: site.brand.logoUrl,
    accent: site.brand.colors.accent,
    fontFamily: site.brand.fontFamily,
    ...readContent(site.data),
  }
}

export const sitePages = (site: Site) => Object.keys(rec(site.data.pages))

/** Edited fields laid over the stored site: PUT replaces the whole site, so everything else is kept. */
export function applyDetails(site: Site, d: SiteDetails): SiteInput {
  return {
    slug: site.slug,
    templateId: site.templateId,
    brand: {
      ...site.brand,
      name: d.name,
      logoUrl: d.logoUrl,
      fontFamily: d.fontFamily,
      colors: { ...site.brand.colors, primary: d.accent, accent: d.accent },
    },
    data: writeContent(site.data, d),
    ...(site.domains?.length ? { domains: site.domains } : {}),
  }
}