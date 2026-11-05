import { describe, expect, it } from 'vite-plus/test'

import {
  applyDetails,
  buildSiteInput,
  defaultsFromTemplate,
  detailsFromSite,
  fieldForServiceError,
  sitePages,
  slugify,
  templatePages,
  validateDetails,
} from '../wizard'
import { site, template } from './fixtures'

describe('slugify', () => {
  it('lowercases and joins words with dashes', () => {
    expect(slugify('  Nova Marek! ')).toBe('nova-marek')
  })

  it('strips leading and trailing dashes and caps the length', () => {
    expect(slugify('--a--')).toBe('a')
    expect(slugify('a'.repeat(100))).toHaveLength(60)
  })
})

describe('validateDetails', () => {
  const valid = detailsFromSite(site)

  it('accepts valid details', () => {
    expect(validateDetails(valid)).toEqual({})
  })

  it('flags an empty name, a bad slug and an empty headline', () => {
    const errors = validateDetails({ ...valid, name: ' ', slug: 'Bad Slug', headline: '' })
    expect(Object.keys(errors).sort()).toEqual(['headline', 'name', 'slug'])
  })

  it('flags a missing slug', () => {
    expect(validateDetails({ ...valid, slug: '' }).slug).toBe('Enter a site address')
  })
})

describe('fieldForServiceError', () => {
  it.each([
    ['slug', 'slug'],
    ['domains.0', 'slug'],
    ['brand.name', 'name'],
    ['brand.colors.primary', 'accent'],
    ['data.pages.home.hero.title', 'headline'],
    ['data.pages.home.hero.subtitle', 'bio'],
    ['something.else', undefined],
  ])('maps %s to %s', (field, expected) => {
    expect(fieldForServiceError(field)).toBe(expected)
  })
})

describe('template mapping', () => {
  it('reads form defaults from the template sample', () => {
    expect(defaultsFromTemplate(template)).toMatchObject({
      name: 'Northlight Studio',
      slug: 'northlight-studio',
      headline: 'Stories',
      bio: 'A studio',
      accent: '#F24067',
    })
  })

  it('lists the page keys', () => {
    expect(templatePages(template)).toEqual(['home', 'about'])
    expect(sitePages(site)).toEqual(['home', 'about'])
  })

  it('builds a create payload with only the edited fields in data', () => {
    const input = buildSiteInput(template, { ...defaultsFromTemplate(template), headline: 'Hi' })
    expect(input.templateId).toBe('studio-v1')
    expect(input.brand.colors.accent).toBe('#F24067')
    expect(input.data).toEqual({ pages: { home: { hero: { title: 'Hi', subtitle: 'A studio' } } } })
  })
})

describe('applyDetails', () => {
  it('lays edits over the stored site and keeps everything else', () => {
    const next = applyDetails(site, {
      ...detailsFromSite(site),
      name: 'New name',
      accent: '#0EA5E9',
      headline: 'Edited',
    })
    expect(next.brand.name).toBe('New name')
    expect(next.brand.colors).toMatchObject({
      primary: '#0EA5E9',
      accent: '#0EA5E9',
      background: '#171717',
    })
    expect(next.data).toMatchObject({ seo: site.data.seo })
    expect(next.data.pages).toMatchObject({
      about: { title: 'About' },
      home: { title: 'Home', hero: { enabled: true, title: 'Edited', cta: 'x' } },
    })
    expect(next.domains).toEqual(['northlight.example.test'])
  })

  it('does not mutate the stored site', () => {
    const before = JSON.stringify(site)
    applyDetails(site, { ...detailsFromSite(site), headline: 'Edited' })
    expect(JSON.stringify(site)).toBe(before)
  })
})