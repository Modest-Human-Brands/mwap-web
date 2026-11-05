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

export const template: Template = {
  id: 'contact-sheet',
  label: 'Contact Sheet',
  shortLabel: 'Contact Sheet',
  category: 'Portfolios',
  description: 'Studio template',
  schema: {},
  sample: site.data,
}