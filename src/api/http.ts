import { config } from '@/config'

export interface FieldError {
  field: string
  message: string
  code: string
}

/** Nitro error shape: { statusCode, statusMessage, message, data?: { errors } }. */
export class ApiError extends Error {
  readonly status: number
  readonly errors: FieldError[]

  constructor(status: number, message: string, errors: FieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  query?: Record<string, string | number | undefined>
  body?: unknown
  /** Sends x-api-key and x-org-id (create, replace and delete site). */
  write?: boolean
  signal?: AbortSignal
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(`${config.apiBaseUrl}/api${path}`, window.location.origin)
  for (const [key, value] of Object.entries(opts.query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.write) {
    headers['x-api-key'] = config.apiKey
    headers['x-org-id'] = config.orgId
  }

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  })
  // DELETE answers 204 with no body.
  const payload: unknown = res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    const err = (payload ?? {}) as { message?: string; data?: { errors?: FieldError[] } }
    throw new ApiError(res.status, err.message ?? res.statusText, err.data?.errors ?? [])
  }
  return payload as T
}