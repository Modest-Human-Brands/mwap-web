/**
 * What the content editor knows about a template's `data`: the JSON Schema the service publishes
 * (`GET /api/site/template/:id`). Nothing here is specific to one template, so a new or changed
 * template needs no change in the app.
 */

export interface JsonSchema {
  type?: string
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  enum?: unknown[]
  format?: string
  pattern?: string
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  minItems?: number
  maxItems?: number
  title?: string
  description?: string
  /** Optional hints from the service (zod `.meta()` reaches the schema as extra keywords). */
  [hint: string]: unknown
}

export type Widget =
  | 'text'
  | 'textarea'
  | 'url'
  | 'image'
  | 'video'
  | 'email'
  | 'number'
  | 'toggle'
  | 'select'

export type Path = (string | number)[]
export const pathKey = (path: Path) => path.join('.')

const asString = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)

/** A schema as the editor reads it: an `anyOf` of one real type and `null` (an optional value) becomes that type. */
export function resolve(schema: JsonSchema): JsonSchema {
  const options = schema.anyOf
  if (!Array.isArray(options)) return schema
  const { anyOf: _drop, ...rest } = schema
  const real = options.filter((o) => asSchema(o).type !== 'null')
  return real.length === 1 ? { ...asSchema(real[0]), ...rest } : rest
}

export function asSchema(value: unknown): JsonSchema {
  return value && typeof value === 'object' ? resolve(value as JsonSchema) : {}
}

const ACRONYMS = new Set(['cta', 'seo', 'og', 'url', 'faq', 'id', 'api', 'ui', 'ga'])

/** `titleLines` → "Title lines"; `ogImage` → "Og image". */
export function humanize(key: string) {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w))
    .join(' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** "Title lines" → "Title line", for one row of a list. */
export function singular(label: string) {
  if (/ies$/i.test(label)) return label.replace(/ies$/i, 'y')
  if (/(ss|us)$/i.test(label)) return label
  return label.replace(/s$/i, '')
}

export const labelFor = (key: string, s: JsonSchema) =>
  asString(s.label) ?? asString(s['x-label']) ?? asString(s.title) ?? humanize(key)

export const helpFor = (s: JsonSchema) =>
  asString(s.help) ?? asString(s['x-help']) ?? asString(s.description)

const IMAGE_KEY = /image|photo|poster|portrait|avatar|logo|cover|thumb|picture|banner|icon/i
const VIDEO_KEY = /video|reel|clip|movie/i
const LONG_KEY =
  /description|bio|body|text|summary|statement|paragraph|about|quote|content|message|intro|note/i

const WIDGETS: Widget[] = [
  'text',
  'textarea',
  'url',
  'image',
  'video',
  'email',
  'number',
  'toggle',
  'select',
]

/** The input for a leaf field: the service's hint when it gave one, otherwise a guess from type, format and name. */
export function widgetFor(key: string, s: JsonSchema): Widget {
  const hint = asString(s.widget) ?? asString(s['x-widget'])
  if (hint && (WIDGETS as string[]).includes(hint)) return hint as Widget
  if (s.enum) return 'select'
  if (s.type === 'boolean') return 'toggle'
  if (s.type === 'number' || s.type === 'integer') return 'number'
  if (s.format === 'email') return 'email'
  if (s.format === 'uri') {
    if (VIDEO_KEY.test(key)) return 'video'
    if (IMAGE_KEY.test(key)) return 'image'
    return 'url'
  }
  if ((s.maxLength ?? 0) >= 160 || LONG_KEY.test(key)) return 'textarea'
  return 'text'
}

/** A new, empty list item: required fields get an empty value of the right type. */
export function blankFor(s: JsonSchema): unknown {
  if (s.type === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, child] of Object.entries(s.properties ?? {})) {
      if (k === 'enabled') out[k] = true
      else if (s.required?.includes(k)) out[k] = blankFor(child)
    }
    return out
  }
  if (s.type === 'array')
    return Array.from({ length: s.minItems ?? 0 }, () => blankFor(asSchema(s.items)))
  if (s.type === 'boolean') return false
  if (s.type === 'number' || s.type === 'integer') return s.minimum ?? 0
  if (s.enum?.length) return s.enum[0]
  return ''
}

/** Reads `data` at `path`. */
export function getIn(data: unknown, path: Path): unknown {
  let cur = data
  for (const key of path) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string | number, unknown>)[key]
  }
  return cur
}

/** A copy of `data` with `value` at `path`; `undefined` removes the key (or list item). */
export function setIn<T>(data: T, path: Path, value: unknown): T {
  if (!path.length) return value as T
  const [head, ...rest] = path as [string | number, ...Path]
  if (Array.isArray(data)) {
    const next = [...data]
    const i = Number(head)
    if (rest.length === 0 && value === undefined) next.splice(i, 1)
    else next[i] = setIn(next[i], rest, value)
    return next as T
  }
  const base = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const next = { ...base }
  if (rest.length === 0 && value === undefined) delete next[head]
  else next[head] = setIn(base[head], rest, value)
  return next as T
}

const URI = /^[a-z][a-z0-9+.-]*:\/\/\S+$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function leafError(s: JsonSchema, v: unknown): string | undefined {
  if (s.type === 'number' || s.type === 'integer') {
    if (typeof v !== 'number' || Number.isNaN(v)) return 'Enter a number'
    if (s.type === 'integer' && !Number.isInteger(v)) return 'Enter a whole number'
    if (s.minimum !== undefined && v < s.minimum) return `Use ${s.minimum} or more`
    if (s.maximum !== undefined && v > s.maximum) return `Use ${s.maximum} or less`
    return undefined
  }
  if (s.type === 'boolean') return undefined
  const text = typeof v === 'string' ? v : ''
  if (s.minLength !== undefined && text.length < s.minLength)
    return s.minLength === 1 ? 'Required' : `Use at least ${s.minLength} characters`
  if (s.maxLength !== undefined && text.length > s.maxLength)
    return `Use at most ${s.maxLength} characters`
  if (s.format === 'email' && !EMAIL.test(text)) return 'Enter a valid email address'
  if (s.format === 'uri' && !URI.test(text)) return 'Enter a full URL, starting with https://'
  if (s.pattern) {
    try {
      if (!new RegExp(s.pattern).test(text))
        return s.format === 'uri' || /https?/.test(s.pattern)
          ? 'Use a link starting with #, /, https://, mailto: or tel:'
          : 'Use the format the template expects'
    } catch {
      // A pattern the browser cannot compile is left to the service to enforce.
    }
  }
  if (s.enum && !s.enum.includes(v)) return 'Choose one of the options'
  return undefined
}

/**
 * Checks `data` against the template schema and returns one message per failing path.
 * Covers what the service enforces: required fields, formats, patterns, lengths and list sizes.
 * The service stays the judge; this only catches the common mistakes before publishing.
 */
export function validateData(
  schema: JsonSchema,
  data: unknown,
  path: Path = [],
  out: Record<string, string> = {},
): Record<string, string> {
  const fail = (msg: string) => {
    out[pathKey(path)] = msg
  }
  if (schema.type === 'object') {
    const obj =
      data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : {}
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (obj[key] === undefined) {
        if (schema.required?.includes(key)) {
          const blank = blankFor(child)
          const err =
            child.type === 'object' || child.type === 'array' ? undefined : leafError(child, blank)
          out[pathKey([...path, key])] = err ?? 'Required'
        }
        continue
      }
      validateData(child, obj[key], [...path, key], out)
    }
  } else if (schema.type === 'array') {
    const list = Array.isArray(data) ? data : []
    if (schema.minItems !== undefined && list.length < schema.minItems)
      fail(`Add at least ${schema.minItems}`)
    else if (schema.maxItems !== undefined && list.length > schema.maxItems)
      fail(`Use at most ${schema.maxItems}`)
    const item = asSchema(schema.items)
    list.forEach((v, i) => validateData(item, v, [...path, i], out))
  } else {
    const err = leafError(schema, data)
    if (err) fail(err)
  }
  return out
}

/** `data.pages.home.cover.title` (a service error field) → the editor path `pages.home.cover.title`. */
export function contentPathOf(field: string): string | undefined {
  return field.startsWith('data.') ? field.slice(5) : undefined
}

/** The pages of a template or site: `pages` keys in order. */
export function pageKeys(data: unknown): string[] {
  const pages = getIn(data, ['pages'])
  return pages && typeof pages === 'object' ? Object.keys(pages) : []
}

/** Sections of a page that are switched on, as `[key, label]`. */
export function enabledSections(
  data: unknown,
  page: string,
  schema: JsonSchema,
): [string, string][] {
  const sections =
    asSchema(getIn(schema, ['properties', 'pages', 'properties', page])).properties ?? {}
  const values = getIn(data, ['pages', page])
  const obj = values && typeof values === 'object' ? (values as Record<string, unknown>) : {}
  return Object.entries(sections)
    .filter(
      ([k, s]) => s.type === 'object' && 'enabled' in (s.properties ?? {}) && obj[k] !== undefined,
    )
    .filter(([k]) => getIn(obj, [k, 'enabled']) !== false)
    .map(([k, s]) => [k, labelFor(k, s)])
}

/** A short description for the board card: the first page's own description, if the template has one. */
export function siteDescription(data: unknown): string {
  const first = pageKeys(data)[0]
  const v = first ? getIn(data, ['pages', first, 'description']) : undefined
  return typeof v === 'string' ? v : ''
}