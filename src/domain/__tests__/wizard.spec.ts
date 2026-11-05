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

  it('flags missing or blank measurements and stats', () => {
    expect(validateDetails({ ...valid, measurements: [] }).measurements).toBe(
      'Add at least one measurement',
    )
    expect(
      validateDetails({ ...valid, measurements: [{ label: 'Height', value: ' ' }] }).measurements,
    ).toBe('Fill in every measurement')
    expect(validateDetails({ ...valid, stats: [{ value: '', label: 'x' }] }).stats).toBe(
      'Fill in every stat',
    )
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
    ['data.pages.home.cover.title', 'headline'],
    ['data.pages.home.cover.tagline', 'bio'],
    ['data.pages.home.compCard.measurements.0.value', 'measurements'],
    ['data.pages.home.compCard.stats.1.label', 'stats'],
    ['something.else', undefined],
  ])('maps %s to %s', (field, expected) => {
    expect(fieldForServiceError(field)).toBe(expected)
  })
})

describe('template mapping', () => {
  it('reads form defaults from the template sample', () => {
    expect(defaultsFromTemplate(template)).toMatchObject({
      name: '',
      slug: '',
      headline: 'Stories',
      bio: 'A studio',
      accent: '#6C3BFF',
      stats: [{ value: '120K', label: 'Followers' }],
    })
    expect(defaultsFromTemplate(template).measurements).toHaveLength(2)
  })

  it('lists the page keys', () => {
    expect(templatePages(template)).toEqual(['home'])
    expect(sitePages(site)).toEqual(['home'])
  })

  it('builds a complete create payload: the sample with the edited content on top', () => {
    const input = buildSiteInput(template, {
      ...defaultsFromTemplate(template),
      headline: 'Hi',
      measurements: [{ label: 'Height', value: '180 cm' }],
      stats: [],
    })
    expect(input.templateId).toBe('contact-sheet')
    expect(input.brand.colors.accent).toBe('#6C3BFF')
    expect(input.data).toMatchObject({
      seo: template.sample.seo,
      pages: {
        home: {
          title: 'Home',
          cover: { enabled: true, title: 'Hi', tagline: 'A studio', label: 'Cover' },
          compCard: {
            title: 'Comp card',
            stats: [],
            measurements: [{ label: 'Height', value: '180 cm' }],
          },
        },
      },
    })
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
      home: {
        title: 'Home',
        cover: { enabled: true, title: 'Edited', tagline: 'A studio', label: 'Cover' },
        compCard: { title: 'Comp card', stats: [{ value: '120K', label: 'Followers' }] },
      },
    })
    expect(next.domains).toEqual(['northlight.example.test'])
  })

  it('does not mutate the stored site', () => {
    const before = JSON.stringify(site)
    applyDetails(site, { ...detailsFromSite(site), headline: 'Edited' })
    expect(JSON.stringify(site)).toBe(before)
  })
})