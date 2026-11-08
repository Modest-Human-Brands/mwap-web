import type { Site, Template } from '@/api'

export const brand: Site['brand'] = {
  name: 'Northlight Studio',
  logoUrl: 'https://example.com/logo.svg',
  faviconUrl: 'https://example.com/favicon.svg',
  fontFamily: 'Oxanium',
  colors: {
    primary: '#FB3737',
    secondary: '#262626',
    accent: '#F24067',
    background: '#171717',
    text: '#F8FAFC',
  },
}

export const site: Site = {
  slug: 'northlight-studio',
  orgId: 'default',
  templateId: 'contact-sheet',
  brand,
  data: {
    seo: { ogImage: 'https://example.com/og.png' },
    contact: { email: 'hi@northlight.example.com' },
    pages: {
      home: {
        title: 'Home',
        cover: { enabled: true, title: 'Stories', tagline: 'A studio', label: 'Cover' },
        compCard: {
          enabled: true,
          title: 'Comp card',
          stats: [{ value: '120K', label: 'Followers' }],
          measurements: [
            { label: 'Height', value: '178 cm' },
            { label: 'Waist', value: '60 cm' },
          ],
        },
      },
    },
  },
  domains: ['northlight.example.test'],
}

const uri = { type: 'string', format: 'uri' }
const text = { type: 'string' }
const link = {
  type: 'object',
  properties: { label: text, href: { type: 'string', pattern: '^(#|\\/|https?:\\/\\/)' } },
  required: ['label', 'href'],
}

/** A trimmed contact-sheet schema: enough shapes to exercise the editor. */
export const contactSchema = {
  type: 'object',
  properties: {
    seo: {
      type: 'object',
      properties: { ogImage: uri, keywords: { type: 'array', items: text } },
      required: ['ogImage'],
    },
    navigation: { type: 'array', maxItems: 2, items: link },
    contact: {
      type: 'object',
      properties: { email: { type: 'string', format: 'email' } },
      required: ['email'],
    },
    pages: {
      type: 'object',
      properties: {
        home: {
          type: 'object',
          properties: {
            title: text,
            cover: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                title: { type: 'string', minLength: 1 },
                tagline: text,
                imageUrl: uri,
              },
              required: ['enabled', 'title', 'tagline'],
            },
            compCard: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                stats: {
                  type: 'array',
                  maxItems: 3,
                  items: {
                    type: 'object',
                    properties: { value: text, label: text },
                    required: ['value', 'label'],
                  },
                },
                measurements: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 10,
                  items: {
                    type: 'object',
                    properties: { label: text, value: text },
                    required: ['label', 'value'],
                  },
                },
              },
              required: ['enabled', 'measurements'],
            },
          },
          required: ['title'],
        },
      },
    },
  },
  required: ['seo', 'contact', 'pages'],
}

export const editorialSchema = {
  type: 'object',
  properties: {
    contact: {
      type: 'object',
      properties: { email: { type: 'string', format: 'email' }, phone: text },
      required: ['email'],
    },
    pages: {
      type: 'object',
      properties: {
        home: {
          type: 'object',
          properties: {
            title: text,
            hero: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                titleLines: { type: 'array', minItems: 1, maxItems: 3, items: text },
                tagline: text,
              },
              required: ['enabled', 'titleLines'],
            },
          },
        },
        about: { type: 'object', properties: { title: text } },
      },
    },
  },
  required: ['contact', 'pages'],
}

export const template: Template = {
  id: 'contact-sheet',
  label: 'Contact Sheet',
  shortLabel: 'Contact Sheet',
  category: 'Portfolios',
  description: 'Studio template',
  schema: contactSchema,
  sample: site.data,
}

export const editorialTemplate: Template = {
  id: 'psychiatrist-editorial',
  label: 'Editorial',
  shortLabel: 'Editorial',
  category: 'Psychiatrists',
  description: 'Two-page clinic template',
  schema: editorialSchema,
  sample: {
    seo: { ogImage: 'https://example.com/og.png' },
    contact: { email: 'hello@clinic.example.com', phone: '+91 1' },
    pages: {
      home: {
        title: 'Home',
        hero: { enabled: true, titleLines: ['Care that', 'listens'], tagline: 'A calm clinic' },
        statement: {
          enabled: true,
          stats: [
            { value: '12', label: 'Years' },
            { value: '3K', label: 'Patients' },
          ],
        },
        appointment: { enabled: true, hours: [{ days: 'Mon - Fri', time: '9 - 5' }] },
      },
      about: { title: 'About' },
    },
  },
}