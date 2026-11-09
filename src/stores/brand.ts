import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

import { sitesApi } from '@/api'
import { config } from '@/config'
import {
  brandFromSite,
  emptyBrand,
  parseBrand,
  validateBrand,
  type BrandErrors,
  type OrgBrand,
} from '@/domain/brand'

export const BRAND_KEY = 'mwap.brand'
const SEEDED_KEY = 'mwap.brand.seeded'

/**
 * The organisation brand, kept in this browser like the document app keeps its organisation.
 * The first time, it is carried over from the site of this organisation that was updated last (so earlier sites keep their look).
 */
export const useBrandStore = defineStore('brand', () => {
  const saved = useStorage<OrgBrand | null>(BRAND_KEY, null, undefined, {
    serializer: {
      read: (raw) => (raw ? parseBrand(JSON.parse(raw)) : null),
      write: (value) => JSON.stringify(value),
    },
  })
  const seeded = useStorage<boolean>(SEEDED_KEY, false)

  /** What new sites start from: the saved brand, or a neutral one until it is set. */
  const brand = computed<OrgBrand>(() => saved.value ?? emptyBrand())
  const isSet = computed(() => saved.value !== null)
  const migrating = ref(false)

  function save(next: OrgBrand): BrandErrors {
    const errors = validateBrand(next)
    if (Object.keys(errors).length) return errors
    saved.value = JSON.parse(JSON.stringify(next)) as OrgBrand
    seeded.value = true
    return {}
  }

  /** Carries the brand of the most recently updated site over, once. A failure leaves it to try again next time. */
  async function migrate() {
    if (saved.value || seeded.value || migrating.value) return
    migrating.value = true
    try {
      const { results } = await sitesApi.list({ org: config.orgId, limit: 100 })
      // The site worked on last: the built-in samples carry a fixed old date, so they never win.
      const latest = [...results].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
      if (latest) {
        const site = await sitesApi.get(latest.slug)
        saved.value = brandFromSite(site.brand)
      }
      seeded.value = true
    } catch {
      // Offline or the service is down: keep the neutral brand and try on the next visit.
    } finally {
      migrating.value = false
    }
  }

  return { brand, isSet, migrating, save, migrate }
})