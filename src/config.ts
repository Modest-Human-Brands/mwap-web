export interface AppConfig {
  apiBaseUrl: string
  siteUrl: string
  /** Where published sites are served (base/slug); the MWap service itself. */
  sitesBaseUrl: string
  /** Optional wildcard domain (e.g. mwap.site): new sites also get `<slug>.<domain>`. */
  siteDomain: string
  useMocks: boolean
  /** DEV ONLY: a browser cannot keep a secret. Production needs a proxy or real user auth. */
  apiKey: string
  orgId: string
}

const env = import.meta.env

export const config: AppConfig = {
  // Dev goes through the Vite proxy (same origin); production may point at the service.
  apiBaseUrl: env.DEV ? '' : (env.VITE_MWAP_API_URL ?? ''),
  siteUrl: env.VUE_PUBLIC_SITE_URL ?? '',
  siteDomain: env.VITE_MWAP_SITE_DOMAIN ?? '',
  sitesBaseUrl: env.VITE_MWAP_SITES_URL ?? (env.DEV ? 'http://localhost:3000' : ''),
  useMocks: env.VITE_USE_MOCKS !== 'false',
  apiKey: env.DEV ? (env.VITE_MWAP_API_KEY ?? '') : '',
  orgId: env.VITE_MWAP_ORG_ID || 'default',
}