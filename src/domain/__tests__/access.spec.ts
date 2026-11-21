import { describe, expect, it } from 'vite-plus/test'

import {
  ACCESS_KEY,
  accessErrors,
  canChange,
  clearAccess,
  emptyAccess,
  isConnected,
  loadAccess,
  normalizeAccess,
  safeNext,
  saveAccess,
} from '../access'

const memory = () => {
  const data = new Map<string, string>()
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  }
}

describe('accessErrors', () => {
  const ok = { organizationId: 'modest-human-brands', userId: 'shirsendu', apiKey: 'k' }

  it('accepts complete details, and an empty organization (the default is used)', () => {
    expect(accessErrors(ok)).toEqual({})
    expect(accessErrors({ ...ok, organizationId: '' })).toEqual({})
  })

  it('needs a user id and an API key', () => {
    expect(accessErrors({ ...emptyAccess() })).toEqual({
      userId: 'Enter your user id',
      apiKey: 'Enter the API key',
    })
    expect(Object.keys(accessErrors({ ...ok, apiKey: '   ' }))).toEqual(['apiKey'])
  })

  it('takes the organization as a lowercase slug, as the service does', () => {
    for (const bad of ['Modest Human', 'UPPER', 'a_b', 'x'.repeat(61)])
      expect(accessErrors({ ...ok, organizationId: bad }).organizationId).toMatch(/slug/)
    expect(accessErrors({ ...ok, organizationId: 'a-b-1' }).organizationId).toBeUndefined()
  })
})

describe('storage', () => {
  it('saves trimmed details and reads them back', () => {
    const s = memory()
    saveAccess({ organizationId: ' acme ', userId: ' u ', apiKey: ' k ' }, s)
    expect(JSON.parse(s.getItem(ACCESS_KEY)!)).toEqual({
      organizationId: 'acme',
      userId: 'u',
      apiKey: 'k',
    })
    expect(loadAccess(s)).toEqual({ organizationId: 'acme', userId: 'u', apiKey: 'k' })
  })

  it('is empty when nothing is saved, or the saved value is damaged', () => {
    const s = memory()
    expect(loadAccess(s)).toEqual(emptyAccess())
    s.setItem(ACCESS_KEY, '{not json')
    expect(loadAccess(s)).toEqual(emptyAccess())
    s.setItem(ACCESS_KEY, JSON.stringify({ userId: 5, apiKey: null }))
    expect(loadAccess(s)).toEqual(emptyAccess())
  })

  it('forgets saved details', () => {
    const s = memory()
    saveAccess({ organizationId: '', userId: 'u', apiKey: 'k' }, s)
    clearAccess(s)
    expect(loadAccess(s)).toEqual(emptyAccess())
  })

  it('does not throw when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(loadAccess(blocked)).toEqual(emptyAccess())
    expect(() => saveAccess(emptyAccess(), blocked)).not.toThrow()
  })

  it('normalizes missing parts', () => {
    expect(normalizeAccess(undefined)).toEqual(emptyAccess())
  })
})

describe('isConnected', () => {
  it('needs both a user and a key', () => {
    expect(isConnected({ userId: 'u', apiKey: 'k' })).toBe(true)
    expect(isConnected({ userId: 'u', apiKey: ' ' })).toBe(false)
    expect(isConnected({ apiKey: 'k' })).toBe(false)
  })
})

describe('safeNext', () => {
  it('returns to same-app paths only', () => {
    expect(safeNext('/sites/a/edit?x=1')).toBe('/sites/a/edit?x=1')
    expect(safeNext('//evil.test')).toBe('/')
    expect(safeNext('https://evil.test')).toBe('/')
    expect(safeNext('/setup?next=/')).toBe('/')
    expect(safeNext(undefined)).toBe('/')
  })
})
describe('canChange', () => {
  it('lets the creator change a site', () => {
    expect(canChange({ createdBy: 'ann' }, 'ann')).toBe(true)
  })

  it('keeps another user of the organization out', () => {
    expect(canChange({ createdBy: 'ann' }, 'bob')).toBe(false)
  })

  it('leaves a site saved before owners were recorded open to its organization', () => {
    expect(canChange({}, 'bob')).toBe(true)
  })
})