import type { Access } from '@/domain/access'
import { config } from '@/config'

import { ApiError, request } from './http'

/**
 * A slug the service can never hold (a tilde is not allowed in one), so asking to delete it changes nothing.
 * The service checks the key, then the organisation, then looks the site up: 404 means both were accepted.
 */
const PROBE = '/site/~connect-check'

/**
 * Checks the typed details against the service before they are saved, with the typed key and
 * organisation rather than the configured ones. Resolves when accepted, otherwise throws an ApiError.
 */
export async function verifyAccess(access: Access, signal?: AbortSignal): Promise<void> {
  const org = access.organizationId.trim() || config.orgId
  try {
    await request(PROBE, {
      method: 'DELETE',
      write: true,
      headers: { 'x-api-key': access.apiKey.trim(), 'x-org-id': org },
      signal,
    })
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return
      if (error.status === 401)
        throw new ApiError(401, 'The service rejected this API key. Check it and try again.')
      if (error.status === 400)
        throw new ApiError(400, 'The service did not accept this organization. Check the slug.')
    }
    throw error
  }
}