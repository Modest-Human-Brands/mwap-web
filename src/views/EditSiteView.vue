<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError, sitesApi, templatesApi, type Site, type Template } from '@/api'
import UiButton from '@/components/ui/UiButton.vue'
import DetailsForm from '@/components/wizard/DetailsForm.vue'
import SitePreview from '@/components/wizard/SitePreview.vue'
import WizardShell from '@/components/wizard/WizardShell.vue'
import {
  applyDetails,
  detailsFromSite,
  contentErrorsOf,
  fieldForServiceError,
  siteAddress,
  sitePages,
  validateContent,
  validateDetails,
  withOrgBrand,
  type DetailsErrors,
  type SiteDetails,
} from '@/domain/wizard'
import type { JsonSchema } from '@/domain/schema'
import { useBrandStore } from '@/stores/brand'
import { useSitesStore } from '@/stores/sites'

const route = useRoute()
const router = useRouter()
const slug = String(route.params.slug)
const brandStore = useBrandStore()

const site = ref<Site>()
const template = ref<Template>()
/** Failing content fields, by path. */
const contentErrors = ref<Record<string, string>>({})
const details = ref<SiteDetails>()
const errors = ref<DetailsErrors>({})
const loadError = ref('')
const submitError = ref('')
const saving = ref(false)
const initial = ref('')

onMounted(async () => {
  try {
    site.value = await sitesApi.get(slug)
    template.value = await templatesApi.get(site.value.templateId)
    details.value = detailsFromSite(site.value)
    initial.value = JSON.stringify(details.value)
  } catch (e) {
    loadError.value =
      e instanceof ApiError && e.status === 404
        ? 'This site does not exist.'
        : 'Could not load the site'
  }
})

// The preview shows the stored site with the edits laid over it.
const draft = computed(() =>
  site.value && details.value ? applyDetails(site.value, details.value) : undefined,
)
const back = () => router.push({ name: 'site', params: { slug } })

async function save() {
  if (!site.value || !details.value) return
  errors.value = validateDetails(details.value)
  contentErrors.value = validateContent(template.value?.schema, details.value)
  if (Object.keys(errors.value).length || Object.keys(contentErrors.value).length) return
  saving.value = true
  submitError.value = ''
  try {
    await sitesApi.replace(slug, applyDetails(site.value, details.value))
    useSitesStore().loaded = false
    await back()
  } catch (e) {
    if (e instanceof ApiError) {
      const next: DetailsErrors = {}
      for (const err of e.errors) {
        const field = fieldForServiceError(err.field)
        if (field) next[field] = err.message
      }
      if (e.status === 409 && e.message.startsWith('Domain ')) next.domains = e.message
      errors.value = next
      contentErrors.value = contentErrorsOf(e.errors)
      submitError.value =
        e.status === 401
          ? 'The service rejected the API key (dev setup: set VITE_MWAP_WEB_API_KEY).'
          : e.status === 409 && next.domains
            ? 'Fix the domain: another site already uses it.'
            : e.status === 404
              ? 'This site is read-only or belongs to another organization.'
              : Object.keys(next).length || Object.keys(contentErrors.value).length
                ? 'Fix the highlighted fields.'
                : e.message
    } else {
      submitError.value = 'Could not reach the MWap service'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <WizardShell
    :show-stepper="false"
    :dirty="!!details && JSON.stringify(details) !== initial"
    :leave-to="`/sites/${slug}`"
    title="Edit site"
    subtitle="Your site updates live as you type. Changes go live when you save."
  >
    <p v-if="loadError" role="alert" class="text-sm text-text-2">{{ loadError }}</p>
    <p v-else-if="!details" class="text-sm text-text-2">Loading…</p>
    <template v-else>
      <p v-if="submitError" role="alert" class="mb-4 text-sm text-error">{{ submitError }}</p>
      <DetailsForm
        :schema="(template?.schema ?? {}) as JsonSchema"
        :details="details"
        :errors="errors"
        :content-errors="contentErrors"
        slug-locked
        @name="details.name = $event"
        @slug="() => {}"
        @submit="save"
      />
    </template>

    <template #actions>
      <button
        v-if="details"
        type="button"
        class="inline-flex h-8 cursor-pointer items-center rounded-full border border-divider px-3 text-xs font-medium text-white transition-colors hover:bg-white/8"
        @click="details = withOrgBrand(details, brandStore.brand)"
      >
        Use organisation brand
      </button>
      <RouterLink
        :to="{ name: 'brand', query: { from: route.fullPath } }"
        class="inline-flex h-8 cursor-pointer items-center rounded-full border border-divider px-3 text-xs font-medium text-white transition-colors hover:bg-white/8"
        >Change branding</RouterLink
      >
    </template>

    <template #footer>
      <span class="text-xs text-text-2">{{ siteAddress(slug) }}</span>
      <div class="flex items-center gap-3">
        <UiButton variant="ghost" class="border-0" @click="back">Cancel</UiButton>
        <UiButton :disabled="saving || !details" @click="save">
          {{ saving ? 'Saving…' : 'Save changes' }}
        </UiButton>
      </div>
    </template>

    <template #preview>
      <SitePreview
        v-if="site && draft"
        title="Live preview"
        :address="siteAddress(slug)"
        :template-id="site.templateId"
        :brand="draft.brand"
        :data="draft.data"
        :pages="sitePages(site)"
      />
    </template>
  </WizardShell>
</template>