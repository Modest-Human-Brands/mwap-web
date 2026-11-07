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
import { editorialTemplate, site, template } from './fixtures'

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
    expect(validateDetails(valid, 'contact-sheet')).toEqual({})
  })

  it('flags an empty name, a bad slug and an empty headline', () => {
    const errors = validateDetails(
      { ...valid, name: ' ', slug: 'Bad Slug', headline: '' },
      'contact-sheet',
    )
    expect(Object.keys(errors).sort()).toEqual(['headline', 'name', 'slug'])
  })

  it('flags missing or blank measurements and stats', () => {
    expect(validateDetails({ ...valid, rows: [] }, 'contact-sheet').rows).toBe('Add at least 1')
    expect(
      validateDetails({ ...valid, rows: [{ label: 'Height', value: ' ' }] }, 'contact-sheet').rows,
    ).toBe('Fill in every row')
    expect(
      validateDetails({ ...valid, stats: [{ value: '', label: 'x' }] }, 'contact-sheet').stats,
    ).toBe('Fill in every stat')
  })

  it('flags a missing slug', () => {
    expect(validateDetails({ ...valid, slug: '' }, 'contact-sheet').slug).toBe(
      'Enter a site address',
    )
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
    ['data.pages.home.compCard.measurements.0.value', 'rows'],
    ['data.pages.home.appointment.hours.0.time', 'rows'],
    ['data.pages.home.hero.titleLines', 'headline'],
    ['data.contact.email', 'email'],
    ['googleAnalyticsId', 'googleAnalyticsId'],
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
    expect(defaultsFromTemplate(template).rows).toHaveLength(2)
  })

  it('lists the page keys', () => {
    expect(templatePages(template)).toEqual(['home'])
    expect(sitePages(site)).toEqual(['home'])
  })

  it('builds a complete create payload: the sample with the edited content on top', () => {
    const input = buildSiteInput(template, {
      ...defaultsFromTemplate(template),
      headline: 'Hi',
      rows: [{ label: 'Height', value: '180 cm' }],
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

describe('psychiatrist-editorial', () => {
  const defaults = { ...defaultsFromTemplate(editorialTemplate), name: 'Dr Rao', slug: 'dr-rao' }

  it('reads title lines, hours and stats from the sample', () => {
    expect(defaults).toMatchObject({
      headline: 'Care that\nlistens',
      bio: 'A calm clinic',
      email: 'hello@clinic.example.com',
      phone: '+91 1',
      rows: [{ label: 'Mon - Fri', value: '9 - 5' }],
    })
    expect(defaults.stats).toHaveLength(2)
    expect(templatePages(editorialTemplate)).toEqual(['home', 'about'])
  })

  it('writes the headline back as title lines and keeps the other page', () => {
    const input = buildSiteInput(editorialTemplate, {
      ...defaults,
      headline: ' One \n\n Two ',
      phone: '',
      googleAnalyticsId: 'G-ABC123',
    })
    expect(input.googleAnalyticsId).toBe('G-ABC123')
    expect(input.data).toMatchObject({
      contact: { email: 'hello@clinic.example.com' },
      pages: { about: { title: 'About' }, home: { hero: { titleLines: ['One', 'Two'] } } },
    })
    expect(JSON.stringify(input.data.contact)).not.toContain('phone')
  })

  it('requires 2 stats, an email and at most 3 title lines', () => {
    const errors = validateDetails(
      { ...defaults, stats: [defaults.stats[0]!], email: 'nope', headline: 'a\nb\nc\nd' },
      'psychiatrist-editorial',
    )
    expect(Object.keys(errors).sort()).toEqual(['email', 'headline', 'stats'])
  })

  it('validates the Google Analytics id only when given', () => {
    const id = 'psychiatrist-editorial'
    expect(validateDetails({ ...defaults, googleAnalyticsId: '' }, id)).toEqual({})
    expect(
      validateDetails({ ...defaults, googleAnalyticsId: 'UA-1' }, id).googleAnalyticsId,
    ).toMatch(/G-/)
  })
})

describe('an unknown template', () => {
  it('only validates name, address and analytics id', () => {
    const d = { ...defaultsFromTemplate(template), name: 'x', slug: 'x', headline: '', email: '' }
    expect(validateDetails(d, 'something-new')).toEqual({})
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
    expect(next.data.contact).toEqual({ email: 'hi@northlight.example.com' })
  })

  it('does not mutate the stored site', () => {
    const before = JSON.stringify(site)
    applyDetails(site, { ...detailsFromSite(site), headline: 'Edited' })
    expect(JSON.stringify(site)).toBe(before)
  })
})