import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  ApiError,
  sitesApi,
  templatesApi,
  type Site,
  type Template,
  type TemplateSummary,
} from '@/api'
import { config } from '@/config'
import { buildCatalog, type WizardTemplate } from '@/domain/templates'
import {
  buildSiteInput,
  defaultsFromTemplate,
  fieldForServiceError,
  slugify,
  templatePages,
  validateDetails,
  type DetailsErrors,
  type SiteDetails,
} from '@/domain/wizard'
import { setSiteMeta } from '@/mock/siteMeta'
import { useSitesStore } from './sites'

export const STEPS = [
  { path: '/new', label: 'Template' },
  { path: '/new/details', label: 'Details' },
  { path: '/new/review', label: 'Review & publish' },
] as const

export const useWizardStore = defineStore('wizard', () => {
  const catalog = ref<WizardTemplate[]>([])
  const catalogError = ref('')
  const templateId = ref('')
  /** Full backend templates (schema + sample), by backend id. */
  const backend = ref<Record<string, Template>>({})
  const details = ref<SiteDetails>()
  const slugTouched = ref(false)
  const errors = ref<DetailsErrors>({})
  const submitError = ref('')
  const publishing = ref(false)
  const published = ref<Site>()

  /** True once the user changed anything from the template defaults. */
  const dirty = computed(() => {
    const tpl = backendTemplate.value
    return (
      !!(tpl && details.value) &&
      JSON.stringify(details.value) !== JSON.stringify(defaultsFromTemplate(tpl))
    )
  })
  const template = computed(() => catalog.value.find((t) => t.id === templateId.value))
  const backendTemplate = computed(() =>
    template.value ? backend.value[template.value.backendId] : undefined,
  )

  async function loadCatalog() {
    if (catalog.value.length) return
    catalogError.value = ''
    try {
      let real: TemplateSummary[] = []
      try {
        real = await templatesApi.list()
      } catch (e) {
        if (!config.useMocks) throw e
      }
      catalog.value = buildCatalog(real)
      if (!templateId.value && catalog.value[0]) await selectTemplate(catalog.value[0].id)
    } catch (e) {
      catalogError.value =
        e instanceof ApiError ? `${e.status}: ${e.message}` : 'Could not reach the MWap service'
    }
  }

  async function ensureBackend(id: string) {
    if (!backend.value[id]) backend.value[id] = await templatesApi.get(id)
    return backend.value[id]
  }

  async function selectTemplate(id: string) {
    const picked = catalog.value.find((t) => t.id === id)
    if (!picked) return
    const tpl = await ensureBackend(picked.backendId)
    if (templateId.value !== id || !details.value) {
      templateId.value = id
      // Keep what the user typed when they only switch template.
      details.value ??= defaultsFromTemplate(tpl)
    }
  }

  function setName(name: string) {
    if (!details.value) return
    details.value.name = name
    if (!slugTouched.value) details.value.slug = slugify(name)
  }

  function setSlug(slug: string) {
    if (!details.value) return
    slugTouched.value = true
    details.value.slug = slug.toLowerCase()
  }

  function validate() {
    errors.value = details.value ? validateDetails(details.value) : {}
    return Object.keys(errors.value).length === 0
  }

  async function publish() {
    const tpl = backendTemplate.value
    const d = details.value
    if (!tpl || !d || !template.value) return false
    publishing.value = true
    submitError.value = ''
    try {
      published.value = await sitesApi.create(buildSiteInput(tpl, d))
      // Backend gap: no status/description/pages, so a mock keeps them for the board.
      if (config.useMocks) {
        setSiteMeta(
          d.slug,
          { status: 'published', description: d.bio, pages: templatePages(tpl).length },
          d.name,
        )
      }
      useSitesStore().loaded = false
      return true
    } catch (e) {
      if (e instanceof ApiError) {
        const next: DetailsErrors = {}
        for (const err of e.errors) {
          const field = fieldForServiceError(err.field)
          if (field) next[field] = err.message
        }
        errors.value = next
        submitError.value =
          e.status === 409
            ? 'That address is already taken. Choose another one.'
            : e.status === 401
              ? 'The service rejected the API key (dev setup: set VITE_MWAP_API_KEY).'
              : Object.keys(next).length
                ? 'Fix the highlighted fields.'
                : e.message
      } else {
        submitError.value = 'Could not reach the MWap service'
      }
      return false
    } finally {
      publishing.value = false
    }
  }

  function reset() {
    templateId.value = ''
    details.value = undefined
    slugTouched.value = false
    errors.value = {}
    submitError.value = ''
    published.value = undefined
  }

  return {
    catalog,
    catalogError,
    templateId,
    template,
    backendTemplate,
    dirty,
    details,
    errors,
    submitError,
    publishing,
    published,
    loadCatalog,
    selectTemplate,
    setName,
    setSlug,
    validate,
    publish,
    reset,
  }
})