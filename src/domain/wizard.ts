import type { Brand, Site, SiteData, SiteInput, Template } from '@/api'
import { config } from '@/config'

export interface SiteDetails {
  name: string
  slug: string
  logoUrl: string
  accent: string
  fontFamily: string
  headline: string
  bio: string
}

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

/** Details form defaults, read from the template sample (the service's own placeholder content). */
export function defaultsFromTemplate(template: Template): SiteDetails {
  const hero = rec(rec(rec(template.sample.data.pages).home).hero)
  const name = template.sample.brand.name
  return {
    name,
    slug: slugify(name),
    logoUrl: template.sample.brand.logoUrl,
    accent: template.sample.brand.colors.accent,
    fontFamily: template.sample.brand.fontFamily,
    headline: typeof hero.title === 'string' ? hero.title : '',
    bio: typeof hero.subtitle === 'string' ? hero.subtitle : '',
  }
}

/** Page keys of the template (home, projects, about…), for the preview rail. */
export const templatePages = (template: Template) => Object.keys(rec(template.sample.data.pages))

export function buildBrand(template: Template, d: SiteDetails): Brand {
  const { brand } = template.sample
  return {
    ...brand,
    name: d.name,
    logoUrl: d.logoUrl,
    fontFamily: d.fontFamily,
    colors: { ...brand.colors, primary: d.accent, accent: d.accent },
  }
}

/** Only what the form edits; the service fills the rest from the template sample. */
export function buildData(d: SiteDetails): SiteData {
  return { pages: { home: { hero: { title: d.headline, subtitle: d.bio } } } }
}

export function buildSiteInput(template: Template, d: SiteDetails): SiteInput {
  return {
    slug: d.slug,
    templateId: template.id,
    brand: buildBrand(template, d),
    data: buildData(d),
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
  return errors
}

/** Maps service field paths (brand.name, slug, domains.0…) to form fields. */
export function fieldForServiceError(field: string): keyof SiteDetails | undefined {
  if (field === 'slug' || field.startsWith('domains')) return 'slug'
  if (field === 'brand.name') return 'name'
  if (field === 'brand.logoUrl') return 'logoUrl'
  if (field === 'brand.fontFamily') return 'fontFamily'
  if (field.startsWith('brand.colors')) return 'accent'
  if (field.endsWith('hero.title')) return 'headline'
  if (field.endsWith('hero.subtitle')) return 'bio'
  return undefined
}
/** Form values of an existing site (edit screen). */
export function detailsFromSite(site: Site): SiteDetails {
  const hero = rec(rec(rec(site.data.pages).home).hero)
  return {
    name: site.brand.name,
    slug: site.slug,
    logoUrl: site.brand.logoUrl,
    accent: site.brand.colors.accent,
    fontFamily: site.brand.fontFamily,
    headline: typeof hero.title === 'string' ? hero.title : '',
    bio: typeof hero.subtitle === 'string' ? hero.subtitle : '',
  }
}

export const sitePages = (site: Site) => Object.keys(rec(site.data.pages))

/** Edited fields laid over the stored site: PUT replaces the whole site, so everything else is kept. */
export function applyDetails(site: Site, d: SiteDetails): SiteInput {
  const pages = rec(site.data.pages)
  const home = rec(pages.home)
  const hero = rec(home.hero)
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
    data: {
      ...site.data,
      pages: { ...pages, home: { ...home, hero: { ...hero, title: d.headline, subtitle: d.bio } } },
    },
    ...(site.domains?.length ? { domains: site.domains } : {}),
  }
}