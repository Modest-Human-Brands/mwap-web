/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="unplugin-icons/types/vue" />

interface ImportMetaEnv {
  readonly ORGANIZATION_ID?: string
  readonly VITE_MWAP_WEB_SITE_URL?: string
  readonly VITE_MWAP_WEB_API_URL?: string
  readonly VITE_MWAP_WEB_SITES_URL?: string
  readonly VITE_MWAP_WEB_SITE_DOMAIN?: string
  readonly VITE_MWAP_WEB_USE_MOCKS?: string
  readonly VITE_MWAP_WEB_API_KEY?: string
  readonly VITE_MWAP_WEB_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}