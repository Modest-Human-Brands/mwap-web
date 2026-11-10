import { computed, ref, watch } from 'vue'
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
  withOrgBrand,
  contentErrorsOf,
  fieldForServiceError,
  slugify,
  templatePages,
  validateContent,
  validateDetails,
  type DetailsErrors,
  type SiteDetails,
} from '@/domain/wizard'
import { siteDescription } from '@/domain/schema'
import { setSiteMeta } from '@/mock/siteMeta'
import { useBrandStore } from './brand'
import { useSitesStore } from './sites'

export const STEPS = [
  { path: '/new', label: 'Template' },
  { path: '/new/details', label: 'Details' },
  { path: '/new/review', label: 'Review & publish' },
] as const

export const useWizardStore = defineStore('wizard', () => {
  const brandStore = useBrandStore()
  const catalog = ref<WizardTemplate[]>([])
  const catalogError = ref('')
  const templateId = ref('')
  /** Full backend templates (schema + sample), by backend id. */
  const backend = ref<Record<string, Template>>({})
  const details = ref<SiteDetails>()
  /** Backend template the current details were built for. */
  const detailsFor = ref('')
  const slugTouched = ref(false)
  const errors = ref<DetailsErrors>({})
  /** Failing content fields (the generated part of the form), by path. */
  const contentErrors = ref<Record<string, string>>({})
  const submitError = ref('')
  const publishing = ref(false)
  const published = ref<Site>()

  /** True once the user changed anything from the template defaults. */
  const dirty = computed(() => {
    const tpl = backendTemplate.value
    return (
      !!(tpl && details.value) &&
      JSON.stringify(details.value) !== JSON.stringify(defaultsFromTemplate(tpl, brandStore.brand))
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
      const prev = details.value
      const sameLayout = prev && detailsFor.value === tpl.id
      templateId.value = id
      detailsFor.value = tpl.id
      if (!prev) details.value = defaultsFromTemplate(tpl, brandStore.brand)
      else if (!sameLayout) {
        // A different template has different content: start its content from its own sample but
        // keep the name, address and brand the user already typed.
        const { name, slug, logoUrl, primary, accent, fontFamily, domains, googleAnalyticsId } =
          prev
        contentErrors.value = {}
        details.value = {
          ...defaultsFromTemplate(tpl, brandStore.brand),
          name,
          slug,
          logoUrl,
          primary,
          accent,
          fontFamily,
          domains,
          googleAnalyticsId,
        }
      }
    }
  }

  /** Brand is edited on the Brand screen only: the form always carries the organisation's current one. */
  function syncBrand() {
    if (details.value) details.value = withOrgBrand(details.value, brandStore.brand)
  }

  watch(() => brandStore.brand, syncBrand)

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
    const tpl = backendTemplate.value
    errors.value = details.value ? validateDetails(details.value) : {}
    contentErrors.value = details.value && tpl ? validateContent(tpl.schema, details.value) : {}
    return Object.keys(errors.value).length === 0 && Object.keys(contentErrors.value).length === 0
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
          {
            status: 'published',
            description: siteDescription(d.data),
            pages: templatePages(tpl).length,
          },
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
        // The service words a domain conflict as 409 "Domain … is already used by site …".
        if (e.status === 409 && e.message.startsWith('Domain ')) next.domains = e.message
        errors.value = next
        contentErrors.value = contentErrorsOf(e.errors)
        submitError.value =
          e.status === 409
            ? next.domains
              ? 'Fix the domain: another site already uses it.'
              : 'That address is already taken. Choose another one.'
            : e.status === 401
              ? 'The service rejected the API key (dev setup: set VITE_MWAP_WEB_API_KEY).'
              : Object.keys(next).length || Object.keys(contentErrors.value).length
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
    detailsFor.value = ''
    slugTouched.value = false
    errors.value = {}
    contentErrors.value = {}
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
    contentErrors,
    submitError,
    publishing,
    published,
    loadCatalog,
    selectTemplate,
    syncBrand,
    setName,
    setSlug,
    validate,
    publish,
    reset,
  }
})