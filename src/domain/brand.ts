import type { Brand } from '@/api'

/**
 * The organisation's brand: set once on the Brand screen, then every new site starts from it.
 * It lives in this browser (the service is stateless and takes the brand with every request).
 * Only the logo, colours, font and business name reach a site; legal, bank and contact details stay here.
 */

export const ENTITY_TYPES = ['LLP', 'Private Limited', 'Proprietorship'] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export const TRADE_RELATIONSHIPS = [
  'Primary',
  'Trading As',
  'Operating Division',
  'Wholly-Owned Subsidiary',
  'Special Purpose Vehicle',
] as const
export type TradeRelationship = (typeof TRADE_RELATIONSHIPS)[number]

export const SOCIAL_KEYS = ['instagram', 'facebook', 'linkedin', 'youtube'] as const
export type SocialKey = (typeof SOCIAL_KEYS)[number]

export const FIRST_FOUNDED_YEAR = 1900
export const DEFAULT_FONT = 'Geist'
/** The font a site falls back to when the chosen one cannot be loaded. */
export const FALLBACK_FONT = 'Exo 2'

export interface OrgBrand {
  businessName: string
  /** A link to an image (SVG, PNG, JPG or WebP); the service stores no files. */
  logoUrl: string
  primary: string
  accent: string
  fontFamily: string
  legalName: string
  address: string
  entity: EntityType | ''
  tradeRelationship: TradeRelationship | ''
  foundedYear: string
  pan: string
  gstin: string
  bank: { accountName: string; accountNumber: string; bankName: string; ifscCode: string }
  contactEmail: string
  billingEmail: string
  phone: string
  whatsapp: string
  website: string
  socials: Record<SocialKey, string>
}

export const DEFAULT_LOGO =
  'https://api.iconify.design/lucide/globe.svg?color=%236C3BFF&width=64&height=64'

export function emptyBrand(): OrgBrand {
  return {
    businessName: '',
    logoUrl: DEFAULT_LOGO,
    primary: '#6C3BFF',
    accent: '#6C3BFF',
    fontFamily: DEFAULT_FONT,
    legalName: '',
    address: '',
    entity: '',
    tradeRelationship: '',
    foundedYear: '',
    pan: '',
    gstin: '',
    bank: { accountName: '', accountNumber: '', bankName: '', ifscCode: '' },
    contactEmail: '',
    billingEmail: '',
    phone: '',
    whatsapp: '',
    website: '',
    socials: { instagram: '', facebook: '', linkedin: '', youtube: '' },
  }
}

/** Reads a stored brand, tolerating missing or wrong-typed fields (older or hand-edited storage). */
export function parseBrand(raw: unknown): OrgBrand {
  const base = emptyBrand()
  if (!raw || typeof raw !== 'object') return base
  const src = raw as Record<string, unknown>
  const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback)
  const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
  const bank = obj(src.bank)
  const socials = obj(src.socials)
  const pick = <T extends string>(v: unknown, all: readonly T[]) =>
    all.includes(v as T) ? (v as T) : ''
  return {
    businessName: str(src.businessName, base.businessName),
    logoUrl: str(src.logoUrl, base.logoUrl),
    primary: str(src.primary, base.primary),
    accent: str(src.accent, base.accent),
    fontFamily: str(src.fontFamily, base.fontFamily),
    legalName: str(src.legalName, ''),
    address: str(src.address, ''),
    entity: pick(src.entity, ENTITY_TYPES),
    tradeRelationship: pick(src.tradeRelationship, TRADE_RELATIONSHIPS),
    foundedYear: str(src.foundedYear, ''),
    pan: str(src.pan, ''),
    gstin: str(src.gstin, ''),
    bank: {
      accountName: str(bank.accountName, ''),
      accountNumber: str(bank.accountNumber, ''),
      bankName: str(bank.bankName, ''),
      ifscCode: str(bank.ifscCode, ''),
    },
    contactEmail: str(src.contactEmail, ''),
    billingEmail: str(src.billingEmail, ''),
    phone: str(src.phone, ''),
    whatsapp: str(src.whatsapp, ''),
    website: str(src.website, ''),
    socials: Object.fromEntries(SOCIAL_KEYS.map((k) => [k, str(socials[k], '')])) as Record<
      SocialKey,
      string
    >,
  }
}

/** A site's brand, carried over to the organisation brand (one-off migration from the first existing site). */
export function brandFromSite(site: Brand): OrgBrand {
  return {
    ...emptyBrand(),
    businessName: site.name,
    logoUrl: site.logoUrl,
    primary: site.colors.primary,
    accent: site.colors.accent,
    fontFamily: site.fontFamily,
  }
}

/** `#abc` or `#aabbcc` → `#AABBCC`; null when it is not a hex colour. */
export function normalizeHex(input: string): string | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim())
  if (!match) return null
  const hex = match[1] ?? ''
  const full = hex.length === 3 ? hex.replace(/./g, '$&$&') : hex
  return `#${full.toUpperCase()}`
}

const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^\+?[0-9][0-9 ()-]{6,19}$/
const URL_RE = /^https?:\/\/\S+\.\S+$/i

export type BrandErrors = Record<string, string>

/** Every field is optional; what is filled in must be well formed. Keys are dotted paths (`bank.ifscCode`). */
export function validateBrand(b: OrgBrand, now = new Date()): BrandErrors {
  const e: BrandErrors = {}
  const text = (v: string) => v.trim()
  if (text(b.logoUrl) && !URL_RE.test(text(b.logoUrl)))
    e.logoUrl = 'Enter a full link, starting with https://'
  if (!normalizeHex(b.primary)) e.primary = 'Use a hex colour such as #6C3BFF'
  if (!normalizeHex(b.accent)) e.accent = 'Use a hex colour such as #6C3BFF'
  if (!text(b.fontFamily)) e.fontFamily = 'Choose a font'
  else if (!/^[A-Za-z0-9 ]{1,60}$/.test(text(b.fontFamily))) e.fontFamily = 'Use a plain font name'
  if (text(b.pan) && !PAN.test(text(b.pan).toUpperCase())) e.pan = 'PAN looks like ABCDE0123F'
  if (text(b.gstin) && !GSTIN.test(text(b.gstin).toUpperCase()))
    e.gstin = 'Enter a valid 15-character GSTIN'
  if (text(b.foundedYear)) {
    const year = Number(b.foundedYear)
    if (!Number.isInteger(year) || year < FIRST_FOUNDED_YEAR || year > now.getFullYear())
      e.foundedYear = `Use a year from ${FIRST_FOUNDED_YEAR} to ${now.getFullYear()}`
  }
  if (text(b.bank.ifscCode) && !IFSC.test(text(b.bank.ifscCode).toUpperCase()))
    e['bank.ifscCode'] = 'IFSC looks like HDFC0001234'
  if (text(b.bank.accountNumber) && !/^[0-9]{6,20}$/.test(text(b.bank.accountNumber)))
    e['bank.accountNumber'] = 'Use 6 to 20 digits'
  if (text(b.contactEmail) && !EMAIL.test(text(b.contactEmail)))
    e.contactEmail = 'Enter a valid email address'
  if (text(b.billingEmail) && !EMAIL.test(text(b.billingEmail)))
    e.billingEmail = 'Enter a valid email address'
  if (text(b.phone) && !PHONE.test(text(b.phone))) e.phone = 'Enter a valid phone number'
  if (text(b.whatsapp) && !PHONE.test(text(b.whatsapp))) e.whatsapp = 'Enter a valid phone number'
  if (text(b.website) && !URL_RE.test(text(b.website)))
    e.website = 'Enter a full link, starting with https://'
  for (const k of SOCIAL_KEYS)
    if (text(b.socials[k]) && !URL_RE.test(text(b.socials[k])))
      e[`socials.${k}`] = 'Enter a full link, starting with https://'
  return e
}

/** What the collapsed groups show: "HDFC Bank · ••7890", "billing@ · +91", "4 socials". */
export function bankSummary(b: OrgBrand): string {
  const { bankName, accountNumber } = b.bank
  const tail = accountNumber.trim().slice(-4)
  const parts = [bankName.trim(), tail ? `••${tail}` : ''].filter(Boolean)
  return parts.join(' · ') || 'Not set'
}

export function contactSummary(b: OrgBrand): string {
  const mail = b.billingEmail.trim() || b.contactEmail.trim()
  const parts = [
    mail ? `${mail.split('@')[0]}@` : '',
    b.phone.trim().split(/[ (]/)[0] ?? '',
  ].filter(Boolean)
  return parts.join(' · ') || 'Not set'
}

export function socialsSummary(b: OrgBrand): string {
  const n = SOCIAL_KEYS.filter((k) => b.socials[k].trim()).length
  return n ? `${n} social${n === 1 ? '' : 's'}` : 'Not set'
}

/** The brand a site carries: the service reads name, logo, favicon, font and colours from it. */
export function siteBrand(org: OrgBrand, siteName: string): Brand {
  const logoUrl = org.logoUrl.trim() || DEFAULT_LOGO
  return {
    name: siteName,
    logoUrl,
    faviconUrl: logoUrl,
    fontFamily: org.fontFamily.trim() || DEFAULT_FONT,
    colors: {
      primary: normalizeHex(org.primary) ?? '#6C3BFF',
      secondary: '#98989F',
      accent: normalizeHex(org.accent) ?? '#6C3BFF',
      background: '#0C0912',
      text: '#F8FAFC',
    },
  }
}