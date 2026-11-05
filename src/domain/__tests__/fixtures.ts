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
  templateId: 'studio-v1',
  brand,
  data: {
    seo: { ogImage: 'https://example.com/og.png' },
    pages: {
      home: {
        title: 'Home',
        hero: { enabled: true, title: 'Stories', subtitle: 'A studio', cta: 'x' },
      },
      about: { title: 'About' },
    },
  },
  domains: ['northlight.example.test'],
}

export const template: Template = {
  id: 'studio-v1',
  label: 'Studio',
  shortLabel: 'Studio',
  category: 'Studios',
  description: 'Studio template',
  schema: {},
  sample: { brand, data: site.data },
}