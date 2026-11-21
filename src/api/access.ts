import type { Access } from '@/domain/access'
import { config } from '@/config'

import { ApiError, request } from './http'

/**
 * Checks the typed details against the service before they are saved, with the typed key, organisation and
 * user rather than the configured ones. Resolves when accepted, otherwise throws an ApiError.
 * The service checks the key first (401), then the organisation and the user (400).
 */
export async function verifyAccess(access: Access, signal?: AbortSignal): Promise<void> {
  const org = access.organizationId.trim() || config.orgId
  try {
    await request('/access', {
      headers: {
        'x-api-key': access.apiKey.trim(),
        'x-org-id': org,
        'x-user-id': access.userId.trim(),
      },
      signal,
    })
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401)
        throw new ApiError(401, 'The service rejected this API key. Check it and try again.')
      if (error.status === 400) {
        const field = error.errors[0]?.field
        throw new ApiError(
          400,
          field === 'x-user-id'
            ? 'The service did not accept this user id. Check it.'
            : 'The service did not accept this organization. Check the slug.',
        )
      }
    }
    throw error
  }
}