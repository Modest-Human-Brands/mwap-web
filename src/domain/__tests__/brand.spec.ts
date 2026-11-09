import { describe, expect, it } from 'vite-plus/test'

import type { Brand } from '@/api'
import {
  bankSummary,
  brandFromSite,
  contactSummary,
  DEFAULT_LOGO,
  emptyBrand,
  normalizeHex,
  parseBrand,
  siteBrand,
  socialsSummary,
  validateBrand,
} from '../brand'

describe('normalizeHex', () => {
  it('expands and upper-cases a hex colour', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC')
    expect(normalizeHex(' #5945ea ')).toBe('#5945EA')
  })
  it('rejects anything else', () => {
    expect(normalizeHex('5945EA')).toBeNull()
    expect(normalizeHex('#12')).toBeNull()
    expect(normalizeHex('red')).toBeNull()
  })
})

describe('validateBrand', () => {
  it('accepts the neutral brand (every field is optional)', () => {
    expect(validateBrand(emptyBrand())).toEqual({})
  })

  it('checks the identifiers that are filled in', () => {
    const b = emptyBrand()
    b.pan = 'ABC'
    b.gstin = '123'
    b.foundedYear = '1800'
    b.bank.ifscCode = 'XX'
    b.bank.accountNumber = '12ab'
    expect(Object.keys(validateBrand(b)).sort()).toEqual(
      ['bank.accountNumber', 'bank.ifscCode', 'foundedYear', 'gstin', 'pan'].sort(),
    )
  })

  it('accepts well-formed identifiers in any letter case', () => {
    const b = emptyBrand()
    b.pan = 'abcde0123f'
    b.gstin = '22AAAAA0000A1Z5'
    b.foundedYear = '2025'
    b.bank.ifscCode = 'hdfc0001234'
    expect(validateBrand(b, new Date('2026-06-01'))).toEqual({})
  })

  it('rejects a founding year in the future', () => {
    const b = emptyBrand()
    b.foundedYear = '2031'
    expect(validateBrand(b, new Date('2026-06-01')).foundedYear).toMatch(/1900/)
  })

  it('needs full links and valid colours', () => {
    const b = emptyBrand()
    b.logoUrl = 'logo.svg'
    b.website = 'example.com'
    b.socials.instagram = 'instagram'
    b.primary = 'purple'
    expect(Object.keys(validateBrand(b)).sort()).toEqual(
      ['logoUrl', 'primary', 'socials.instagram', 'website'].sort(),
    )
  })

  it('allows an empty logo (the default is used)', () => {
    const b = emptyBrand()
    b.logoUrl = ''
    expect(validateBrand(b)).toEqual({})
    expect(siteBrand(b, 'X').logoUrl).toBe(DEFAULT_LOGO)
  })
})

describe('summaries', () => {
  it('shows the bank with the last four digits', () => {
    const b = emptyBrand()
    expect(bankSummary(b)).toBe('Not set')
    b.bank.bankName = 'HDFC Bank'
    b.bank.accountNumber = '1234567890'
    expect(bankSummary(b)).toBe('HDFC Bank · ••7890')
  })
  it('shows the contact and the number of socials', () => {
    const b = emptyBrand()
    b.billingEmail = 'billing@acme.test'
    b.phone = '+91 99999 99999'
    expect(contactSummary(b)).toBe('billing@ · +91')
    b.socials.instagram = 'https://instagram.com/a'
    b.socials.youtube = 'https://youtube.com/a'
    expect(socialsSummary(b)).toBe('2 socials')
  })
})

describe('storage', () => {
  it('fills what an older or hand-edited record lacks', () => {
    const b = parseBrand({
      businessName: 'Acme',
      entity: 'Corp',
      bank: 'x',
      socials: { instagram: 5 },
    })
    expect(b.businessName).toBe('Acme')
    expect(b.entity).toBe('')
    expect(b.bank.bankName).toBe('')
    expect(b.socials.instagram).toBe('')
    expect(parseBrand(null)).toEqual(emptyBrand())
  })
})

describe('siteBrand and migration', () => {
  const site: Brand = {
    name: 'Northlight',
    logoUrl: 'https://cdn.test/logo.svg',
    faviconUrl: 'https://cdn.test/fav.ico',
    fontFamily: 'Inter',
    colors: {
      primary: '#111111',
      secondary: '#222222',
      accent: '#333333',
      background: '#000000',
      text: '#ffffff',
    },
  }

  it('carries the oldest site brand over to the organisation', () => {
    const org = brandFromSite(site)
    expect(org).toMatchObject({
      businessName: 'Northlight',
      logoUrl: site.logoUrl,
      fontFamily: 'Inter',
      primary: '#111111',
      accent: '#333333',
    })
  })

  it('gives a site the name it is called, and the organisation logo, font and colours', () => {
    const out = siteBrand({ ...brandFromSite(site), accent: '#abc' }, 'My site')
    expect(out.name).toBe('My site')
    expect(out.logoUrl).toBe(site.logoUrl)
    expect(out.faviconUrl).toBe(site.logoUrl)
    expect(out.fontFamily).toBe('Inter')
    expect(out.colors.accent).toBe('#AABBCC')
  })
})