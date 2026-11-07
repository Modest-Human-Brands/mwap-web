/** Shapes of the MWap service (see the Postman collection "MWap RESTful API"). */

export interface BrandColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

export interface Brand {
  name: string
  logoUrl: string
  faviconUrl: string
  fontFamily: string
  colors: BrandColors
}

/** Template payload; the schema is published per template, so it stays loose here. */
export type SiteData = Record<string, unknown>

export interface Site {
  slug: string
  orgId: string
  templateId: string
  brand: Brand
  data: SiteData
  domains?: string[]
  /** GA4 measurement id (G-XXXX); the site reports only to its own property. */
  googleAnalyticsId?: string
  updatedAt?: string
}

export interface SiteSummary {
  slug: string
  orgId: string
  templateId: string
  name: string
  updatedAt: string
}

export interface Page<T> {
  results: T[]
  pagination: { total: number; limit: number; offset: number }
}

export interface TemplateSummary {
  id: string
  label: string
  shortLabel: string
  category: string | null
  description: string
}

export interface Template extends TemplateSummary {
  schema: Record<string, unknown>
  /** A complete `data` payload (no brand: the service has none to suggest). */
  sample: SiteData
}

export interface SiteInput {
  slug: string
  templateId: string
  brand: Brand
  data: SiteData
  domains?: string[]
  googleAnalyticsId?: string
}

export interface PreviewInput {
  templateId: string
  page?: string
  brand: Brand
  data: SiteData
}

export interface PreviewResult {
  html: string
  page: string
}