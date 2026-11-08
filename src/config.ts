export interface AppConfig {
  apiBaseUrl: string
  siteUrl: string
  /** Where published sites are served (base/slug); the MWap service itself. */
  sitesBaseUrl: string
  /** Optional wildcard domain (e.g. mwap.site): new sites also get `<slug>.<domain>`. */
  siteDomain: string
  useMocks: boolean
  /** A browser cannot keep a secret: set at runtime via /config.js, readable by anyone. Stopgap until a proxy or real user auth. */
  apiKey: string
  orgId: string
}

/** Written to /config.js by docker/runtime-config.sh when the container starts. Empty values are ignored. */
interface RuntimeConfig {
  apiBaseUrl?: string
  sitesBaseUrl?: string
  siteDomain?: string
  orgId?: string
  apiKey?: string
}

declare global {
  interface Window {
    __MWAP_CONFIG__?: RuntimeConfig
  }
}

const env = import.meta.env
const runtime: RuntimeConfig = (typeof window !== 'undefined' && window.__MWAP_CONFIG__) || {}
/** First non-blank value. */
const pick = (...values: (string | undefined)[]) => values.find((v) => v?.trim())?.trim() ?? ''

const DEV_SERVICE = 'http://localhost:3001'
const PROD_SERVICE = 'https://wap.modesthumanbrands.com'

export const config: AppConfig = {
  // The browser calls the service directly (no proxy): local in dev, deployed in production.
  apiBaseUrl: pick(
    runtime.apiBaseUrl,
    env.VITE_MWAP_WEB_API_URL,
    env.DEV ? DEV_SERVICE : PROD_SERVICE,
  ),
  siteUrl: env.VITE_MWAP_WEB_SITE_URL ?? '',
  siteDomain: pick(runtime.siteDomain, env.VITE_MWAP_WEB_SITE_DOMAIN),
  sitesBaseUrl: pick(
    runtime.sitesBaseUrl,
    env.VITE_MWAP_WEB_SITES_URL,
    env.DEV ? DEV_SERVICE : PROD_SERVICE,
  ),
  useMocks:
    env.VITE_MWAP_WEB_USE_MOCKS !== undefined ? env.VITE_MWAP_WEB_USE_MOCKS !== 'false' : false,
  apiKey: pick(runtime.apiKey, env.VITE_MWAP_WEB_API_KEY),
  orgId: pick(runtime.orgId, env.ORGANIZATION_ID),
}