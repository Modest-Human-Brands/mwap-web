/**
 * Who this browser connects to MWap as. The details stay in this browser; they are checked against the
 * service before they are saved, and they take priority over runtime and build configuration.
 */
export interface Access {
  organizationId: string
  userId: string
  apiKey: string
}

export const ACCESS_KEY = 'mwap.access'

/** The service accepts an organisation as a lowercase slug of at most 60 characters. */
export const ORG_PATTERN = /^[a-z0-9-]{1,60}$/

export const emptyAccess = (): Access => ({ organizationId: '', userId: '', apiKey: '' })

const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export function normalizeAccess(input: Partial<Access> | null | undefined): Access {
  return {
    organizationId: clean(input?.organizationId),
    userId: clean(input?.userId),
    apiKey: clean(input?.apiKey),
  }
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

export function loadAccess(storage: Pick<Storage, 'getItem'> | undefined = safeStorage()): Access {
  try {
    const raw = storage?.getItem(ACCESS_KEY)
    return raw ? normalizeAccess(JSON.parse(raw) as Partial<Access>) : emptyAccess()
  } catch {
    return emptyAccess()
  }
}

export function saveAccess(
  access: Access,
  storage: Pick<Storage, 'setItem'> | undefined = safeStorage(),
): void {
  try {
    storage?.setItem(ACCESS_KEY, JSON.stringify(normalizeAccess(access)))
  } catch {
    // Storage is blocked (private window): the details last until the page closes.
  }
}

export function clearAccess(
  storage: Pick<Storage, 'removeItem'> | undefined = safeStorage(),
): void {
  try {
    storage?.removeItem(ACCESS_KEY)
  } catch {
    // Nothing to clear.
  }
}

export type AccessErrors = Partial<Record<keyof Access, string>>

export function accessErrors(access: Access): AccessErrors {
  const errors: AccessErrors = {}
  const org = access.organizationId.trim()
  if (org && !ORG_PATTERN.test(org))
    errors.organizationId = 'Use the organization slug: lowercase letters, numbers and dashes'
  if (!access.userId.trim()) errors.userId = 'Enter your user id'
  if (!access.apiKey.trim()) errors.apiKey = 'Enter the API key'
  return errors
}

export const isConnected = (access: { userId?: string; apiKey?: string }) =>
  Boolean(access.userId?.trim() && access.apiKey?.trim())

/** Shown wherever the service refuses a change because the site was created by someone else (403). */
export const NOT_OWNER_MESSAGE =
  'This site was created by another user of your organization, so only they can edit or delete it.'

/** Only the user who created a site may change it; a site saved before owners were recorded is open to its organization. */
export const canChange = (site: { createdBy?: string }, userId: string) =>
  !site.createdBy || site.createdBy === userId

/** Only same-app paths are allowed as a return target after connecting. */
export function safeNext(value: unknown): string {
  return typeof value === 'string' && /^\/(?!\/)/.test(value) && !value.startsWith('/setup')
    ? value
    : '/'
}