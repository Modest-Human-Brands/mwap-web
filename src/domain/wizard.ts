import type { Brand, Site, SiteData, SiteInput, Template } from '@/api'
import { config } from '@/config'
import { emptyBrand, siteBrand, type OrgBrand } from './brand'
import { contentPathOf, pageKeys, validateData, type JsonSchema } from './schema'

export interface SiteDetails {
  name: string
  slug: string
  /** Brand the site carries; new sites copy it from the organisation brand. */
  logoUrl: string
  primary: string
  accent: string
  fontFamily: string
  /** GA4 measurement id, optional. */
  googleAnalyticsId: string
  /** The template's `data`: everything the content editor changes. */
  data: SiteData
}

export const SLUG_PATTERN = /^[a-z0-9-]+$/
export const GA_PATTERN = /^G-[A-Z0-9]{4,}$/

/** A deep copy that also works on Vue reactive objects (`structuredClone` throws on a proxy). */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

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
export function defaultsFromTemplate(
  template: Template,
  org: OrgBrand = emptyBrand(),
): SiteDetails {
  const brand = siteBrand(org, '')
  return {
    name: '',
    slug: '',
    logoUrl: brand.logoUrl,
    primary: brand.colors.primary,
    accent: brand.colors.accent,
    fontFamily: brand.fontFamily,
    googleAnalyticsId: '',
    data: clone(template.sample),
  }
}

/** Page keys of the template (home, about…), for the preview rail. */
export const templatePages = (template: Template) => pageKeys(template.sample)

export function buildBrand(_template: Template, d: SiteDetails): Brand {
  const brand = DEFAULT_BRAND
  return {
    ...brand,
    // The service rejects an empty name, so the live preview shows a placeholder until one is typed.
    name: d.name.trim() || 'Your site',
    logoUrl: d.logoUrl,
    faviconUrl: d.logoUrl,
    fontFamily: d.fontFamily,
    colors: { ...brand.colors, primary: d.primary, accent: d.accent },
  }
}

/** Copies the organisation's logo, colours and font into the form (a new site, or "Use organisation brand"). */
export function withOrgBrand(d: SiteDetails, org: OrgBrand): SiteDetails {
  const brand = siteBrand(org, d.name)
  return {
    ...d,
    logoUrl: brand.logoUrl,
    primary: brand.colors.primary,
    accent: brand.colors.accent,
    fontFamily: brand.fontFamily,
  }
}

/** The template sample with the form's content laid over it, so the payload is always complete. */
export function buildData(_template: Template, d: SiteDetails): SiteData {
  return d.data
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

/** Name, address, brand and analytics: the fields every template shares. */
export function validateDetails(d: SiteDetails): DetailsErrors {
  const errors: DetailsErrors = {}
  if (!d.name.trim()) errors.name = 'Enter a site name'
  if (!d.slug) errors.slug = 'Enter a site address'
  else if (!SLUG_PATTERN.test(d.slug)) errors.slug = 'Use lowercase letters, numbers and dashes'
  if (d.googleAnalyticsId.trim() && !GA_PATTERN.test(d.googleAnalyticsId.trim()))
    errors.googleAnalyticsId = 'Use a GA4 measurement id like G-ABC123XYZ'
  return errors
}

/** The content fields that fail the template's own schema, by path (`pages.home.cover.title`). */
export const validateContent = (schema: unknown, d: SiteDetails) =>
  validateData((schema ?? {}) as JsonSchema, d.data)

/** Maps service field paths (brand.name, slug, domains.0…) to form fields. */
export function fieldForServiceError(field: string): keyof SiteDetails | undefined {
  if (field === 'slug' || field.startsWith('domains')) return 'slug'
  if (field === 'brand.name') return 'name'
  if (field === 'brand.logoUrl') return 'logoUrl'
  if (field === 'brand.fontFamily') return 'fontFamily'
  if (field.startsWith('brand.colors')) return 'accent'
  if (field === 'brand.faviconUrl') return 'logoUrl'
  if (field === 'googleAnalyticsId') return 'googleAnalyticsId'
  return undefined
}

/** Service errors on the content, keyed like `validateContent`. */
export function contentErrorsOf(errors: { field: string; message: string }[]) {
  const out: Record<string, string> = {}
  for (const e of errors) {
    const path = contentPathOf(e.field)
    if (path) out[path] = e.message
  }
  return out
}

/** Form values of an existing site (edit screen). */
export function detailsFromSite(site: Site): SiteDetails {
  return {
    name: site.brand.name,
    slug: site.slug,
    logoUrl: site.brand.logoUrl,
    primary: site.brand.colors.primary,
    accent: site.brand.colors.accent,
    fontFamily: site.brand.fontFamily,
    googleAnalyticsId: site.googleAnalyticsId ?? '',
    data: clone(site.data),
  }
}

export const sitePages = (site: Site) => pageKeys(site.data)

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
      colors: { ...site.brand.colors, primary: d.primary, accent: d.accent },
    },
    data: d.data,
    ...(d.googleAnalyticsId.trim() ? { googleAnalyticsId: d.googleAnalyticsId.trim() } : {}),
    ...(site.domains?.length ? { domains: site.domains } : {}),
  }
}