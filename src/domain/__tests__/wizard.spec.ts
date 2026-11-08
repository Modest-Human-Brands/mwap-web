import { describe, expect, it } from 'vite-plus/test'
import { reactive } from 'vue'

import {
  applyDetails,
  buildData,
  buildSiteInput,
  contentErrorsOf,
  defaultsFromTemplate,
  detailsFromSite,
  fieldForServiceError,
  sitePages,
  slugify,
  templatePages,
  validateContent,
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
    expect(validateDetails(valid)).toEqual({})
  })

  it('flags a blank name and a malformed address', () => {
    const errors = validateDetails({ ...valid, name: ' ', slug: 'Bad Slug' })
    expect(Object.keys(errors).sort()).toEqual(['name', 'slug'])
  })

  it('flags a missing slug', () => {
    expect(validateDetails({ ...valid, slug: '' }).slug).toBe('Enter a site address')
  })

  it('validates the Google Analytics id only when given', () => {
    expect(validateDetails({ ...valid, googleAnalyticsId: '' })).toEqual({})
    expect(validateDetails({ ...valid, googleAnalyticsId: 'UA-1' }).googleAnalyticsId).toMatch(/G-/)
  })
})

describe('validateContent', () => {
  it('uses the template schema', () => {
    const d = defaultsFromTemplate(template)
    expect(validateContent(template.schema, d)).toEqual({})
    const bad = {
      ...d,
      data: { ...d.data, contact: { email: 'nope' } },
    }
    expect(Object.keys(validateContent(template.schema, bad))).toEqual(['contact.email'])
  })

  it('has nothing to check for a template without a schema', () => {
    expect(validateContent({}, defaultsFromTemplate(template))).toEqual({})
  })
})

describe('fieldForServiceError', () => {
  it.each([
    ['slug', 'slug'],
    ['domains.0', 'slug'],
    ['brand.name', 'name'],
    ['brand.colors.primary', 'accent'],
    ['googleAnalyticsId', 'googleAnalyticsId'],
    ['data.pages.home.cover.title', undefined],
    ['something.else', undefined],
  ])('maps %s to %s', (field, expected) => {
    expect(fieldForServiceError(field)).toBe(expected)
  })
})

describe('contentErrorsOf', () => {
  it('keeps the data errors, keyed by editor path', () => {
    expect(
      contentErrorsOf([
        { field: 'data.pages.home.cover.title', message: 'Required' },
        { field: 'slug', message: 'Taken' },
      ]),
    ).toEqual({ 'pages.home.cover.title': 'Required' })
  })
})

describe('template mapping', () => {
  it('starts from the template sample, which is copied', () => {
    const d = defaultsFromTemplate(template)
    expect(d).toMatchObject({ name: '', slug: '', accent: '#6C3BFF', data: template.sample })
    expect(d.data).not.toBe(template.sample)
  })

  it('copies a template held in reactive state, as the wizard store does', () => {
    const held = reactive({ ...template })
    expect(defaultsFromTemplate(held).data).toEqual(template.sample)
  })

  it('lists the page keys', () => {
    expect(templatePages(template)).toEqual(['home'])
    expect(templatePages(editorialTemplate)).toEqual(['home', 'about'])
    expect(sitePages(site)).toEqual(['home'])
  })

  it('builds a complete create payload from the edited content', () => {
    const d = defaultsFromTemplate(template)
    const input = buildSiteInput(template, { ...d, googleAnalyticsId: ' G-ABC123 ' })
    expect(input.templateId).toBe('contact-sheet')
    expect(input.brand.colors.accent).toBe('#6C3BFF')
    expect(input.googleAnalyticsId).toBe('G-ABC123')
    expect(input.data).toEqual(buildData(template, d))
    expect(input.data).toEqual(template.sample)
  })

  it('omits the analytics id when empty', () => {
    expect('googleAnalyticsId' in buildSiteInput(template, defaultsFromTemplate(template))).toBe(
      false,
    )
  })
})

describe('applyDetails', () => {
  it('lays edits over the stored site and keeps its address, domains and brand', () => {
    const d = detailsFromSite(site)
    const next = applyDetails(site, { ...d, name: 'New name', accent: '#0EA5E9' })
    expect(next.brand.name).toBe('New name')
    expect(next.brand.colors).toMatchObject({
      primary: '#0EA5E9',
      accent: '#0EA5E9',
      background: '#171717',
    })
    expect(next.slug).toBe('northlight-studio')
    expect(next.domains).toEqual(['northlight.example.test'])
    expect(next.data).toEqual(site.data)
  })

  it('writes the edited content', () => {
    const d = detailsFromSite(site)
    const data = { ...d.data, contact: { email: 'new@northlight.example.com' } }
    expect(applyDetails(site, { ...d, data }).data.contact).toEqual({
      email: 'new@northlight.example.com',
    })
  })

  it('does not mutate the stored site', () => {
    const before = JSON.stringify(site)
    const d = detailsFromSite(site)
    d.data.contact = { email: 'x@y.zz' }
    applyDetails(site, d)
    expect(JSON.stringify(site)).toBe(before)
  })

  it('keeps the analytics id of the site', () => {
    const withGa = { ...site, googleAnalyticsId: 'G-ABC123' }
    expect(detailsFromSite(withGa).googleAnalyticsId).toBe('G-ABC123')
    expect(applyDetails(withGa, detailsFromSite(withGa)).googleAnalyticsId).toBe('G-ABC123')
    expect(
      'googleAnalyticsId' in
        applyDetails(site, { ...detailsFromSite(site), googleAnalyticsId: '' }),
    ).toBe(false)
  })
})