import { describe, expect, it } from 'vite-plus/test'

import {
  asSchema,
  blankFor,
  contentPathOf,
  enabledSections,
  getIn,
  humanize,
  labelFor,
  setIn,
  singular,
  siteDescription,
  validateData,
  widgetFor,
  type JsonSchema,
} from '../schema'
import { contactSchema, editorialTemplate, site, template } from './fixtures'

const schema = contactSchema as JsonSchema

describe('humanize', () => {
  it.each([
    ['titleLines', 'Title lines'],
    ['ogImage', 'OG image'],
    ['primaryCta', 'Primary CTA'],
    ['seo', 'SEO'],
    ['bookingEndpoint', 'Booking endpoint'],
    ['year', 'Year'],
  ])('%s → %s', (key, label) => expect(humanize(key)).toBe(label))

  it('prefers the label the service gives', () => {
    expect(labelFor('ogImage', { label: 'Share image' })).toBe('Share image')
    expect(labelFor('ogImage', { title: 'Social card' })).toBe('Social card')
  })
})

describe('resolve', () => {
  it('reads an optional value (anyOf with null) as its real type', () => {
    const s = { anyOf: [{ type: 'string', format: 'uri' }, { type: 'null' }], title: 'Poster' }
    expect(asSchema(s)).toMatchObject({ type: 'string', format: 'uri', title: 'Poster' })
  })
})

describe('singular', () => {
  it.each([
    ['Title lines', 'Title line'],
    ['Categories', 'Category'],
    ['Stats', 'Stat'],
    ['Progress', 'Progress'],
    ['Status', 'Status'],
  ])('%s → %s', (a, b) => expect(singular(a)).toBe(b))
})

describe('widgetFor', () => {
  it.each([
    ['imageUrl', { type: 'string', format: 'uri' }, 'image'],
    ['portraitUrl', { type: 'string', format: 'uri' }, 'image'],
    ['reelUrl', { type: 'string', format: 'uri' }, 'video'],
    ['bookingEndpoint', { type: 'string', format: 'uri' }, 'url'],
    ['email', { type: 'string', format: 'email' }, 'email'],
    ['enabled', { type: 'boolean' }, 'toggle'],
    ['bio', { type: 'string' }, 'textarea'],
    ['note', { type: 'string', maxLength: 400 }, 'textarea'],
    ['title', { type: 'string' }, 'text'],
    ['count', { type: 'integer' }, 'number'],
    ['tone', { type: 'string', enum: ['a', 'b'] }, 'select'],
  ])('%s → %s', (key, s, expected) => expect(widgetFor(key, s as JsonSchema)).toBe(expected))

  it('follows a hint from the service over the guess', () => {
    expect(widgetFor('hero', { type: 'string', format: 'uri', widget: 'video' })).toBe('video')
    expect(widgetFor('hero', { type: 'string', 'x-widget': 'textarea' })).toBe('textarea')
    expect(widgetFor('hero', { type: 'string', widget: 'bogus' })).toBe('text')
  })
})

describe('getIn / setIn', () => {
  const data = { a: { b: [{ c: 1 }, { c: 2 }] } }

  it('reads nested values and lists', () => {
    expect(getIn(data, ['a', 'b', 1, 'c'])).toBe(2)
    expect(getIn(data, ['a', 'x', 'y'])).toBeUndefined()
  })

  it('returns a changed copy and leaves the original alone', () => {
    const next = setIn(data, ['a', 'b', 0, 'c'], 9)
    expect(getIn(next, ['a', 'b', 0, 'c'])).toBe(9)
    expect(getIn(data, ['a', 'b', 0, 'c'])).toBe(1)
    expect(next.a.b[1]).toBe(data.a.b[1])
  })

  it('creates missing parents and removes a key or list item with undefined', () => {
    expect(setIn({}, ['a', 'b'], 1)).toEqual({ a: { b: 1 } })
    expect(setIn({ a: 1, b: 2 }, ['a'], undefined)).toEqual({ b: 2 })
    expect(setIn({ l: [1, 2, 3] }, ['l', 1], undefined)).toEqual({ l: [1, 3] })
  })
})

describe('blankFor', () => {
  it('fills required fields and switches a section on', () => {
    const cover = schema.properties!.pages!.properties!.home!.properties!.cover!
    expect(blankFor(cover)).toEqual({ enabled: true, title: '', tagline: '' })
  })

  it('starts a list at its minimum length', () => {
    expect(blankFor({ type: 'array', minItems: 2, items: { type: 'string' } })).toEqual(['', ''])
  })
})

describe('validateData', () => {
  it('accepts the sample of the template', () => {
    expect(validateData(schema, template.sample)).toEqual({})
  })

  it('flags an invalid email, a link that is not a URL and a missing required field', () => {
    const data = setIn(
      setIn(site.data, ['contact', 'email'], 'nope'),
      ['pages', 'home', 'cover', 'imageUrl'],
      'not a url',
    )
    const errors = validateData(schema, setIn(data, ['seo'], undefined))
    expect(errors['contact.email']).toMatch(/email/)
    expect(errors['pages.home.cover.imageUrl']).toMatch(/URL/)
    expect(errors['seo']).toBe('Required')
  })

  it('checks the minimum length of a required text', () => {
    const errors = validateData(schema, setIn(site.data, ['pages', 'home', 'cover', 'title'], ''))
    expect(errors['pages.home.cover.title']).toBe('Required')
  })

  it('checks list sizes and every item', () => {
    const none = setIn(site.data, ['pages', 'home', 'compCard', 'measurements'], [])
    expect(validateData(schema, none)['pages.home.compCard.measurements']).toBe('Add at least 1')

    const nav = setIn(
      site.data,
      ['navigation'],
      [
        { label: 'A', href: '#a' },
        { label: 'B', href: 'nope' },
        { label: 'C', href: '#c' },
      ],
    )
    const errors = validateData(schema, nav)
    expect(errors['navigation']).toBe('Use at most 2')
    expect(errors['navigation.1.href']).toMatch(/link/)
  })

  it('skips optional fields that are left out', () => {
    expect(validateData(schema, template.sample)['pages.home.cover.imageUrl']).toBeUndefined()
  })
})

describe('page helpers', () => {
  it('maps a service error field to an editor path', () => {
    expect(contentPathOf('data.pages.home.cover.title')).toBe('pages.home.cover.title')
    expect(contentPathOf('brand.name')).toBeUndefined()
  })

  it('lists the sections that are switched on', () => {
    expect(enabledSections(site.data, 'home', schema)).toEqual([
      ['cover', 'Cover'],
      ['compCard', 'Comp card'],
    ])
    const off = setIn(site.data, ['pages', 'home', 'cover', 'enabled'], false)
    expect(enabledSections(off, 'home', schema).map(([k]) => k)).toEqual(['compCard'])
  })

  it('reads a card description from the first page, if it has one', () => {
    expect(siteDescription(site.data)).toBe('')
    expect(siteDescription(setIn(site.data, ['pages', 'home', 'description'], 'Hi'))).toBe('Hi')
    expect(siteDescription(editorialTemplate.sample)).toBe('')
  })
})