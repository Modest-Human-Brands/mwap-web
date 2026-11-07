import type { Brand, Site, SiteData, SiteInput, Template } from '@/api'
import { config } from '@/config'
import { profileFor, type Content } from './content'

export type { Row, Stat } from './content'

export interface SiteDetails extends Content {
  name: string
  slug: string
  logoUrl: string
  accent: string
  fontFamily: string
  /** GA4 measurement id, optional. */
  googleAnalyticsId: string
}

export const SLUG_PATTERN = /^[a-z0-9-]+$/
export const GA_PATTERN = /^G-[A-Z0-9]{4,}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

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
    googleAnalyticsId: '',
    ...profileFor(template.id).read(template.sample),
  }
}

/** Page keys of the template (home, about…), for the preview rail. */
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
  return profileFor(template.id).write(template.sample, d)
}

export function buildSiteInput(template: Template, d: SiteDetails): SiteInput {
  return {
    slug: d.slug,
    templateId: template.id,
    brand: buildBrand(template, d),
    data: buildData(template, d),
    ...(d.googleAnalyticsId.trim() ? { googleAnalyticsId: d.googleAnalyticsId.trim() } : {}),
    ...(config.siteDomain ? { domains: [`${d.slug}.${config.siteDomain}`] } : {}),
  }
}

export type DetailsErrors = Partial<Record<keyof SiteDetails, string>>

export function validateDetails(d: SiteDetails, templateId: string): DetailsErrors {
  const p = profileFor(templateId)
  const errors: DetailsErrors = {}
  if (!d.name.trim()) errors.name = 'Enter a site name'
  if (!d.slug) errors.slug = 'Enter a site address'
  else if (!SLUG_PATTERN.test(d.slug)) errors.slug = 'Use lowercase letters, numbers and dashes'
  if (d.googleAnalyticsId.trim() && !GA_PATTERN.test(d.googleAnalyticsId.trim()))
    errors.googleAnalyticsId = 'Use a GA4 measurement id like G-ABC123XYZ'
  if (!p.supported) return errors

  if (!d.headline.trim()) errors.headline = 'Enter a headline'
  else if (
    p.headlineMultiline &&
    d.headline.split('\n').filter((l) => l.trim()).length > p.headlineMaxLines
  )
    errors.headline = `Use at most ${p.headlineMaxLines} lines`
  if (!d.bio.trim()) errors.bio = `Enter a ${p.bioLabel.toLowerCase()}`
  if (!EMAIL_PATTERN.test(d.email.trim())) errors.email = 'Enter a valid contact email'

  if (d.rows.length < p.rowsMin) errors.rows = `Add at least ${p.rowsMin}`
  else if (d.rows.some((r) => !r.label.trim() || !r.value.trim())) errors.rows = 'Fill in every row'
  if (d.stats.length < p.statsMin) errors.stats = `Add at least ${p.statsMin}`
  else if (d.stats.some((s) => !s.label.trim() || !s.value.trim()))
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
  if (field === 'googleAnalyticsId') return 'googleAnalyticsId'
  if (field.endsWith('contact.email')) return 'email'
  if (field.endsWith('contact.phone')) return 'phone'
  if (field.endsWith('cover.title') || field.includes('hero.titleLines')) return 'headline'
  if (field.endsWith('cover.tagline') || field.endsWith('hero.tagline')) return 'bio'
  if (field.includes('compCard.measurements') || field.includes('appointment.hours')) return 'rows'
  if (field.includes('compCard.stats') || field.includes('statement.stats')) return 'stats'
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
    googleAnalyticsId: site.googleAnalyticsId ?? '',
    ...profileFor(site.templateId).read(site.data),
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
    data: profileFor(site.templateId).write(site.data, d),
    ...(d.googleAnalyticsId.trim() ? { googleAnalyticsId: d.googleAnalyticsId.trim() } : {}),
    ...(site.domains?.length ? { domains: site.domains } : {}),
  }
}