import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import { ApiError, request } from '../http'

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn<(...args: unknown[]) => Promise<Response>>(
    async () => new Response(JSON.stringify(body), { status }),
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('request', () => {
  it('builds the url with query params and skips empty ones', async () => {
    const fn = mockFetch(200, { ok: true })
    await request('/site', { query: { org: 'acme', limit: 10, offset: undefined, q: '' } })
    const url = new URL(String(fn.mock.calls[0]![0]))
    expect(url.pathname).toBe('/api/site')
    expect(url.searchParams.get('org')).toBe('acme')
    expect(url.searchParams.get('limit')).toBe('10')
    expect(url.searchParams.has('offset')).toBe(false)
    expect(url.searchParams.has('q')).toBe(false)
  })

  it('sends the key and org headers only on writes', async () => {
    const fn = mockFetch(200, {})
    await request('/site', { method: 'POST', body: { a: 1 }, write: true })
    await request('/site')
    const write = fn.mock.calls[0]![1] as RequestInit
    const read = fn.mock.calls[1]![1] as RequestInit
    expect(Object.keys(write.headers as object)).toEqual(
      expect.arrayContaining(['x-api-key', 'x-org-id', 'Content-Type']),
    )
    expect(Object.keys(read.headers as object)).not.toContain('x-api-key')
    expect(write.body).toBe('{"a":1}')
  })

  it('throws an ApiError carrying the field errors of a 400', async () => {
    mockFetch(400, {
      message: 'Bad Request',
      data: { errors: [{ field: 'slug', message: 'Invalid', code: 'invalid_format' }] },
    })
    const err = await request('/site').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 400, errors: [{ field: 'slug' }] })
  })

  it('survives a non-JSON error body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<() => Promise<Response>>(
        async () => new Response('oops', { status: 502, statusText: 'Bad Gateway' }),
      ),
    )
    await expect(request('/site')).rejects.toMatchObject({ status: 502 })
  })
})