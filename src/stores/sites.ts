import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError } from '@/api'
import { listSiteCards } from '@/api/dashboard'
import { SITE_STATUSES, matchesSearch, type SiteCard, type SiteStatus } from '@/domain/site'
import { setSiteMeta } from '@/mock/siteMeta'

export const useSitesStore = defineStore('sites', () => {
  const sites = ref<SiteCard[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  const search = ref('')

  const filtered = computed(() => sites.value.filter((s) => matchesSearch(s, search.value)))

  const columns = computed(() =>
    SITE_STATUSES.map((status) => ({
      status,
      sites: filtered.value.filter((s) => s.status === status),
    })),
  )

  async function load() {
    loading.value = true
    error.value = ''
    try {
      sites.value = await listSiteCards()
      loaded.value = true
    } catch (e) {
      error.value =
        e instanceof ApiError ? `${e.status}: ${e.message}` : 'Could not reach the MWap service'
    } finally {
      loading.value = false
    }
  }

  /** Backend gap: no status endpoint, so this only updates the mock. */
  function setStatus(slug: string, status: SiteStatus) {
    const site = sites.value.find((s) => s.slug === slug)
    if (!site) return
    setSiteMeta(slug, { status }, site.name)
    site.status = status
  }

  function remove(slug: string) {
    sites.value = sites.value.filter((s) => s.slug !== slug)
  }

  return { sites, loading, loaded, error, search, filtered, columns, load, setStatus, remove }
})