import type { SiteData } from '@/api'

/** A label/value pair: comp card measurements, appointment hours. */
export interface Row {
  label: string
  value: string
}
/** A headline figure: comp card stats, statement stats. */
export interface Stat {
  value: string
  label: string
}

/** What the form edits of a template's `data` payload; the rest of the payload is kept as is. */
export interface Content {
  headline: string
  bio: string
  email: string
  phone: string
  stats: Stat[]
  rows: Row[]
}

export interface ContentProfile {
  /** False for a template the app has no form for: only name, address and brand are editable. */
  supported: boolean
  headlineLabel: string
  /** One line per title line (`titleLines`), at most `headlineMaxLines`. */
  headlineMultiline: boolean
  headlineMaxLines: number
  bioLabel: string
  phone: boolean
  statsLabel: string
  statsMin: number
  statsMax: number
  rowsLabel: string
  rowsMin: number
  rowsMax: number
  rowLabelPlaceholder: string
  rowValuePlaceholder: string
  read(data: SiteData): Content
  write(data: SiteData, content: Content): SiteData
}

type Rec = Record<string, unknown>
const rec = (v: unknown): Rec => (v && typeof v === 'object' ? (v as Rec) : {})
const text = (v: unknown) => (typeof v === 'string' ? v : '')
const strings = (v: unknown) => (Array.isArray(v) ? v.map(text) : [])
const pairs = (v: unknown, a: string, b: string): [string, string][] =>
  Array.isArray(v) ? v.map((item) => [text(rec(item)[a]), text(rec(item)[b])]) : []

const page = (data: SiteData, key: string) => rec(rec(data.pages)[key])

/** Sets `pages.<key>` to `patch` laid over what is there. */
function withPage(data: SiteData, key: string, patch: (page: Rec) => Rec): SiteData {
  const pages = rec(data.pages)
  return { ...data, pages: { ...pages, [key]: patch(rec(pages[key])) } }
}

/** Sets `contact.email` and, when asked, `contact.phone` (an empty phone is left out). */
function withContact(data: SiteData, c: Content, phone: boolean): SiteData {
  const { phone: _old, ...contact } = rec(data.contact)
  const next: Rec = { ...contact, email: c.email.trim() }
  const value = c.phone.trim()
  if (phone) {
    if (value) next.phone = value
  } else if (_old !== undefined) {
    next.phone = _old
  }
  return { ...data, contact: next }
}

/** `contact-sheet`: single-page model portfolio. */
const contactSheet: ContentProfile = {
  supported: true,
  headlineLabel: 'Headline',
  headlineMultiline: false,
  headlineMaxLines: 1,
  bioLabel: 'Tagline',
  phone: false,
  statsLabel: 'Comp card stats',
  statsMin: 0,
  statsMax: 3,
  rowsLabel: 'Comp card measurements',
  rowsMin: 1,
  rowsMax: 10,
  rowLabelPlaceholder: 'Height',
  rowValuePlaceholder: '178 cm',
  read(data) {
    const home = page(data, 'home')
    const compCard = rec(home.compCard)
    return {
      headline: text(rec(home.cover).title),
      bio: text(rec(home.cover).tagline),
      email: text(rec(data.contact).email),
      phone: '',
      stats: pairs(compCard.stats, 'value', 'label').map(([value, label]) => ({ value, label })),
      rows: pairs(compCard.measurements, 'label', 'value').map(([label, value]) => ({
        label,
        value,
      })),
    }
  },
  write(data, c) {
    const next = withPage(data, 'home', (home) => ({
      ...home,
      cover: { ...rec(home.cover), title: c.headline, tagline: c.bio },
      compCard: {
        ...rec(home.compCard),
        stats: c.stats.map((s) => ({ ...s })),
        measurements: c.rows.map((r) => ({ ...r })),
      },
    }))
    return withContact(next, c, false)
  },
}

/** `psychiatrist-editorial`: home and about. The form edits the home page. */
const editorial: ContentProfile = {
  supported: true,
  headlineLabel: 'Headline (one line per row)',
  headlineMultiline: true,
  headlineMaxLines: 3,
  bioLabel: 'Tagline',
  phone: true,
  statsLabel: 'Statement stats',
  statsMin: 2,
  statsMax: 4,
  rowsLabel: 'Appointment hours',
  rowsMin: 1,
  rowsMax: 7,
  rowLabelPlaceholder: 'Mon – Fri',
  rowValuePlaceholder: '9:00 – 17:00',
  read(data) {
    const home = page(data, 'home')
    return {
      headline: strings(rec(home.hero).titleLines).join('\n'),
      bio: text(rec(home.hero).tagline),
      email: text(rec(data.contact).email),
      phone: text(rec(data.contact).phone),
      stats: pairs(rec(home.statement).stats, 'value', 'label').map(([value, label]) => ({
        value,
        label,
      })),
      rows: pairs(rec(home.appointment).hours, 'days', 'time').map(([label, value]) => ({
        label,
        value,
      })),
    }
  },
  write(data, c) {
    const lines = c.headline
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 3)
    const next = withPage(data, 'home', (home) => ({
      ...home,
      hero: { ...rec(home.hero), titleLines: lines, tagline: c.bio },
      statement: { ...rec(home.statement), stats: c.stats.map((s) => ({ ...s })) },
      appointment: {
        ...rec(home.appointment),
        hours: c.rows.map((r) => ({ days: r.label, time: r.value })),
      },
    }))
    return withContact(next, c, true)
  },
}

/** A template the app has no form for: its payload is passed through untouched. */
const generic: ContentProfile = {
  supported: false,
  headlineLabel: 'Headline',
  headlineMultiline: false,
  headlineMaxLines: 1,
  bioLabel: 'Tagline',
  phone: false,
  statsLabel: 'Stats',
  statsMin: 0,
  statsMax: 0,
  rowsLabel: 'Details',
  rowsMin: 0,
  rowsMax: 0,
  rowLabelPlaceholder: '',
  rowValuePlaceholder: '',
  read: () => ({ headline: '', bio: '', email: '', phone: '', stats: [], rows: [] }),
  write: (data) => data,
}

const PROFILES: Record<string, ContentProfile> = {
  'contact-sheet': contactSheet,
  'psychiatrist-editorial': editorial,
}

export const profileFor = (templateId: string): ContentProfile => PROFILES[templateId] ?? generic